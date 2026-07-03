import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { BondStatus } from '@prisma/client';
import { withErrorHandling, AuthenticationError, ValidationError } from '@/lib/errors';
import { created } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/supabase/client';
import { withCerbos } from '@/lib/cerbos/enforce';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { getBondWithRelations, getClientIp } from '@/lib/bond-helpers';
import { prepareBondCertificate } from '@/lib/certificate/mint';

export const POST = withErrorHandling(
  async (req: NextRequest, { params }: { params: { bondId: string } }) => {
    const user = await getCurrentUser(cookies());
    if (!user) throw new AuthenticationError();

    const bond = await getBondWithRelations(params.bondId);

    const cerbosCallId = await withCerbos(
      user,
      {
        kind: 'certificate',
        id: params.bondId,
        attributes: { bondStatus: bond.status, farmerId: bond.farmerId },
      },
      'generate',
    );

    if (bond.status !== BondStatus.ACTIVE && bond.status !== BondStatus.PENDING_L4) {
      throw new ValidationError('Certificate can only be generated for approved bonds');
    }

    if (bond.certificateStoragePath) {
      throw new ValidationError('Certificate already generated for this bond');
    }

    const minted = await prepareBondCertificate({
      bond,
      actorRole: user.role,
      employeeId: user.employeeId,
      verifyOrigin: req.nextUrl.origin,
      approvalFabricTxId: bond.fabricTxId,
    });

    await prisma.tdrBond.update({
      where: { id: params.bondId },
      data: {
        status: BondStatus.ACTIVE,
        certificateIpfsCid: minted.certificateIpfsCid,
        certificateStoragePath: minted.certificateStoragePath,
        mintedAt: new Date(),
        fabricTxId: minted.fabricTxId,
      },
    });

    // AUDIT: Records manual certificate generation (backfill / commissioner tool)
    await writeAuditLog({
      bondId: params.bondId,
      actorId: user.id,
      actorRole: user.role,
      action: 'CERT_GENERATED',
      details: { certCid: minted.certificateIpfsCid, pdfSize: minted.pdfSize },
      cerbosCallId,
      fabricTxId: minted.fabricTxId,
      ipAddress: getClientIp(req.headers),
    });

    return created({
      bondId: params.bondId,
      status: BondStatus.ACTIVE,
      certificateIpfsCid: minted.certificateIpfsCid,
      fabricTxId: minted.fabricTxId,
      cerbosCallId,
    });
  },
);
