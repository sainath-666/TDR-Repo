import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import QRCode from 'qrcode';
import { BondStatus } from '@prisma/client';
import { withErrorHandling, AuthenticationError, ValidationError } from '@/lib/errors';
import { ok, created } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/supabase/client';
import { withCerbos } from '@/lib/cerbos/enforce';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { generateCertificatePdf } from '@/lib/pdf/certificate';
import { getBondWithRelations, getClientIp } from '@/lib/bond-helpers';
import * as fabric from '@/lib/fabric/gateway';
import { generateApprovalSignature } from '@/lib/security/hmac';

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

    if (bond.status !== BondStatus.PENDING_L4 && bond.status !== BondStatus.ACTIVE) {
      throw new ValidationError('Certificate can only be generated for approved bonds');
    }

    const verifyUrl = `${req.nextUrl.origin}/verify/${bond.tdrNumber}`;
    const qrBuffer = await QRCode.toBuffer(verifyUrl);

    const pdfBuffer = await generateCertificatePdf(
      {
        tdrNumber: bond.tdrNumber,
        holderName: bond.holder!.name,
        aadhaarLast4: bond.holder!.aadhaarHash.slice(-4),
        relationType: bond.holder!.relationType.replace('_', '/'),
        relationName: bond.holder!.relationName,
        surveyNumber: bond.landDetails!.surveyNumber,
        village: bond.landDetails!.surrenderedVillage,
        surrenderedAreaSqYds: Number(bond.landDetails!.surrenderedAreaSqYds),
        tdrExtentSqYds: Number(bond.landDetails!.tdrIssuedExtentSqYds),
        issuedRatio: bond.landDetails!.issuedRatio,
        commissionerName:
          user.role === 'COMMISSIONER' ? 'Commissioner APCRDA' : 'Addl. Commissioner',
        fabricTxId: bond.fabricTxId ?? undefined,
      },
      qrBuffer,
    );

    const certCid = `bafy-cert-${bond.tdrNumber.replace(/[^a-z0-9]/gi, '').toLowerCase()}`;
    const commissionerHash = user.employeeId
      ? generateApprovalSignature(user.employeeId, params.bondId, 'CERT', Date.now())
      : 'unsigned';

    const fabricTxId = await fabric.mintCertificate(bond.tdrNumber, certCid, commissionerHash);

    await prisma.tdrBond.update({
      where: { id: params.bondId },
      data: {
        status: BondStatus.ACTIVE,
        certificateIpfsCid: certCid,
        mintedAt: new Date(),
        fabricTxId,
      },
    });

    await writeAuditLog({
      bondId: params.bondId,
      actorId: user.id,
      actorRole: user.role,
      action: 'CERT_GENERATED',
      details: { certCid, pdfSize: pdfBuffer.length },
      cerbosCallId,
      fabricTxId,
      ipAddress: getClientIp(req.headers),
    });

    return created({
      bondId: params.bondId,
      status: BondStatus.ACTIVE,
      certificateIpfsCid: certCid,
      fabricTxId,
      cerbosCallId,
    });
  },
);
