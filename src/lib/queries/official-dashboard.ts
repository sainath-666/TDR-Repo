import { BondStatus, type Prisma, type ApprovalDecision, type OfficialRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { isPendingStatus } from '@/lib/bond-status';
import { buildDistrictScopeWhere } from '@/lib/bond-helpers';
import {
  getGovApprovalLevel,
  GOV_LEVEL_LABELS,
  LEVEL_FORWARD_STATUSES,
  LEVEL_QUEUE_STATUS,
} from '@/lib/approval-levels';
import type { BondReturnRemark } from '@/lib/return-remark';
import { getLatestReturnRemark } from '@/lib/return-remark';
import type { CurrentUser } from '@/types';

export interface DashboardBondRow {
  id: string;
  tdrNumber: string;
  status: BondStatus;
  updatedAt: Date;
  holderName: string | null;
  surveyNumber: string | null;
  surrenderedAreaSqYds: number | null;
  /** Set when bond was returned to DEO for correction. */
  returnRemark: BondReturnRemark | null;
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
  /** Bond status this role can act on (DRAFT for DEO, PENDING_L* for officials). */
  reviewQueueStatus: BondStatus | null;
}

function mapBondRow(bond: {
  id: string;
  tdrNumber: string;
  status: BondStatus;
  updatedAt: Date;
  holder: { name: string } | null;
  landDetails: { surveyNumber: string; surrenderedAreaSqYds: { toString(): string } } | null;
  approvalSteps: {
    decision: ApprovalDecision;
    remarks: string | null;
    role: OfficialRole;
    decidedAt: Date | null;
    createdAt: Date;
    official: { name: string } | null;
  }[];
}): DashboardBondRow {
  const returnRemark =
    bond.status === BondStatus.DRAFT ? getLatestReturnRemark(bond.approvalSteps) : null;

  return {
    id: bond.id,
    tdrNumber: bond.tdrNumber,
    status: bond.status,
    updatedAt: bond.updatedAt,
    holderName: bond.holder?.name ?? null,
    surveyNumber: bond.landDetails?.surveyNumber ?? null,
    surrenderedAreaSqYds: bond.landDetails ? Number(bond.landDetails.surrenderedAreaSqYds) : null,
    returnRemark,
  };
}

function buildBondWhere(user: CurrentUser, govLevel: number): Prisma.TdrBondWhereInput {
  if (govLevel === 1 && user.districtCode) {
    return buildDistrictScopeWhere(user.districtCode) ?? {};
  }
  if (user.districtCode) {
    return buildDistrictScopeWhere(user.districtCode) ?? {};
  }
  return {};
}

function computeLevelStats(bonds: { status: BondStatus }[], maxLevel: number): LevelStatBlock[] {
  const blocks: LevelStatBlock[] = [];

  if (maxLevel >= 1) {
    blocks.push({
      level: 1,
      title: GOV_LEVEL_LABELS[1] ?? 'DEO / Surveyor',
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
      title: GOV_LEVEL_LABELS[level] ?? `Stage ${level}`,
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
    select: {
      id: true,
      tdrNumber: true,
      status: true,
      updatedAt: true,
      holder: { select: { name: true } },
      landDetails: { select: { surveyNumber: true, surrenderedAreaSqYds: true } },
      approvalSteps: {
        select: {
          id: true,
          level: true,
          role: true,
          decision: true,
          remarks: true,
          decidedAt: true,
          createdAt: true,
          official: { select: { name: true } },
        },
        orderBy: { level: 'asc' },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });

  const queueStatus = LEVEL_QUEUE_STATUS[govLevel];
  const queueCount = queueStatus
    ? bonds.filter((b) => b.status === queueStatus).length
    : bonds.filter((b) => b.status === BondStatus.DRAFT).length;

  const scopeLabel =
    govLevel === 1
      ? user.districtCode
        ? `District: ${user.districtCode} · External records`
        : 'All districts · External records'
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
    reviewQueueStatus: queueStatus ?? (govLevel === 1 ? BondStatus.DRAFT : null),
  };
}
