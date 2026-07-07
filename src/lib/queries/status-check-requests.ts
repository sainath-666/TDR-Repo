import { TdrStatusCheckRequestStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export interface StatusCheckRequestRow {
  id: string;
  referenceId: string;
  tdrNumber: string;
  remarks: string | null;
  status: TdrStatusCheckRequestStatus;
  createdAt: Date;
  documentCount: number;
}

export interface StatusCheckRequestDetail extends StatusCheckRequestRow {
  updatedAt: Date;
  documents: {
    id: string;
    fileName: string;
    contentType: string;
    sizeKb: number;
    createdAt: Date;
  }[];
}

export async function getStatusCheckRequests(): Promise<StatusCheckRequestRow[]> {
  const requests = await prisma.tdrStatusCheckRequest.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: {
      _count: { select: { documents: true } },
    },
  });

  return requests.map((request) => ({
    id: request.id,
    referenceId: request.referenceId,
    tdrNumber: request.tdrNumber,
    remarks: request.remarks,
    status: request.status,
    createdAt: request.createdAt,
    documentCount: request._count.documents,
  }));
}

export async function getStatusCheckRequestById(
  id: string,
): Promise<StatusCheckRequestDetail | null> {
  const request = await prisma.tdrStatusCheckRequest.findUnique({
    where: { id },
    include: {
      documents: {
        orderBy: { createdAt: 'asc' },
        select: {
          id: true,
          fileName: true,
          contentType: true,
          sizeKb: true,
          createdAt: true,
        },
      },
      _count: { select: { documents: true } },
    },
  });

  if (!request) return null;

  return {
    id: request.id,
    referenceId: request.referenceId,
    tdrNumber: request.tdrNumber,
    remarks: request.remarks,
    status: request.status,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    documentCount: request._count.documents,
    documents: request.documents,
  };
}

export async function getStatusCheckRequestSummary(): Promise<{
  total: number;
  pending: number;
}> {
  const [total, pending] = await Promise.all([
    prisma.tdrStatusCheckRequest.count(),
    prisma.tdrStatusCheckRequest.count({
      where: { status: TdrStatusCheckRequestStatus.PENDING },
    }),
  ]);

  return { total, pending };
}
