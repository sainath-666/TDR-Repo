import { BondStatus, type Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { isPendingStatus } from '@/lib/bond-status';
import {
  getGovApprovalLevel,
  GOV_LEVEL_LABELS,
  LEVEL_FORWARD_STATUSES,
  LEVEL_QUEUE_STATUS,
} from '@/lib/approval-levels';
import type { CurrentUser } from '@/types';

export interface DashboardBondRow {
  id: string;
  tdrNumber: string;
  status: BondStatus;
  updatedAt: Date;
  holderName: string | null;
  surveyNumber: string | null;
  surrenderedAreaSqYds: number | null;
}

export interface LevelStatBlock {
  level: number;
  title: string;
  drafts?: number;
  inPipeline?: number;
  inQueue?: number;
  forwarded?: number;
  active?: number;
  rejected?: number;
}

export interface OfficialDashboardData {
  govLevel: number;
  scopeLabel: string;
  summary: {
    total: number;
    pending: number;
    active: number;
    rejected: number;
    drafts: number;
  };
  levelStats: LevelStatBlock[];
  bonds: DashboardBondRow[];
  queueCount: number;
}

function mapBondRow(bond: {
  id: string;
  tdrNumber: string;
  status: BondStatus;
  updatedAt: Date;
  holder: { name: string } | null;
  landDetails: { surveyNumber: string; surrenderedAreaSqYds: { toString(): string } } | null;
}): DashboardBondRow {
  return {
    id: bond.id,
    tdrNumber: bond.tdrNumber,
    status: bond.status,
    updatedAt: bond.updatedAt,
    holderName: bond.holder?.name ?? null,
    surveyNumber: bond.landDetails?.surveyNumber ?? null,
    surrenderedAreaSqYds: bond.landDetails ? Number(bond.landDetails.surrenderedAreaSqYds) : null,
  };
}

function buildBondWhere(user: CurrentUser, govLevel: number): Prisma.TdrBondWhereInput {
  if (govLevel === 1) {
    return { createdBy: user.id };
  }
  if (user.districtCode) {
    return { holder: { district: user.districtCode } };
  }
  return {};
}

function computeLevelStats(bonds: { status: BondStatus }[], maxLevel: number): LevelStatBlock[] {
  const blocks: LevelStatBlock[] = [];

  if (maxLevel >= 1) {
    blocks.push({
      level: 1,
      title: GOV_LEVEL_LABELS[1],
      drafts: bonds.filter((b) => b.status === BondStatus.DRAFT).length,
      inPipeline: bonds.filter(
        (b) =>
          b.status !== BondStatus.DRAFT &&
          b.status !== BondStatus.REJECTED &&
          b.status !== BondStatus.REVOKED,
      ).length,
      active: bonds.filter((b) => b.status === BondStatus.ACTIVE).length,
      rejected: bonds.filter((b) => b.status === BondStatus.REJECTED).length,
    });
  }

  for (let level = 2; level <= maxLevel; level += 1) {
    const queueStatus = LEVEL_QUEUE_STATUS[level];
    const forwardStatuses = LEVEL_FORWARD_STATUSES[level] ?? [];
    if (!queueStatus) continue;

    blocks.push({
      level,
      title: GOV_LEVEL_LABELS[level],
      inQueue: bonds.filter((b) => b.status === queueStatus).length,
      forwarded: bonds.filter((b) => forwardStatuses.includes(b.status)).length,
    });
  }

  return blocks;
}

export async function getOfficialDashboardData(user: CurrentUser): Promise<OfficialDashboardData> {
  const govLevel = getGovApprovalLevel(user.role);
  if (!govLevel) {
    throw new Error('Role does not have an official dashboard');
  }

  const where = buildBondWhere(user, govLevel);

  const bonds = await prisma.tdrBond.findMany({
    where,
    include: { holder: true, landDetails: true },
    orderBy: { updatedAt: 'desc' },
  });

  const queueStatus = LEVEL_QUEUE_STATUS[govLevel];
  const queueCount = queueStatus
    ? bonds.filter((b) => b.status === queueStatus).length
    : bonds.filter((b) => b.status === BondStatus.DRAFT).length;

  const scopeLabel =
    govLevel === 1
      ? 'Your bond entries'
      : user.districtCode
        ? `District: ${user.districtCode}`
        : 'All districts';

  return {
    govLevel,
    scopeLabel,
    summary: {
      total: bonds.length,
      pending: bonds.filter((b) => isPendingStatus(b.status)).length,
      active: bonds.filter((b) => b.status === BondStatus.ACTIVE).length,
      rejected: bonds.filter((b) => b.status === BondStatus.REJECTED).length,
      drafts: bonds.filter((b) => b.status === BondStatus.DRAFT).length,
    },
    levelStats: computeLevelStats(bonds, govLevel),
    bonds: bonds.map(mapBondRow),
    queueCount,
  };
}
