import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { BondStatus } from '@prisma/client';
import { withErrorHandling, AuthenticationError, ValidationError } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/supabase/client';
import { withCerbos } from '@/lib/cerbos/enforce';
import { prisma } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { submitBondSchema, REQUIRED_DOCUMENT_TYPES } from '@/lib/validations/bond';
import { getBondWithRelations, getClientIp } from '@/lib/bond-helpers';
import * as fabric from '@/lib/fabric/gateway';

export const POST = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const user = await getCurrentUser(cookies());
    if (!user) throw new AuthenticationError();

    submitBondSchema.parse(await req.json());

    const idempotencyKey = req.headers.get('X-Idempotency-Key');
    if (idempotencyKey) {
      const cached = await prisma.idempotencyCache.findUnique({
        where: { key: idempotencyKey },
      });
      if (cached && cached.expiresAt > new Date()) {
        return ok(JSON.parse(cached.response));
      }
    }

    const bond = await getBondWithRelations(params.id);
    if (bond.status !== BondStatus.DRAFT) {
      throw new ValidationError('Only DRAFT bonds can be submitted');
    }
    if (!bond.landDetails) throw new ValidationError('Land details required before submit');

    const uploadedTypes = new Set(bond.documents.map((d) => d.docType));
    for (const docType of REQUIRED_DOCUMENT_TYPES) {
      if (!uploadedTypes.has(docType)) {
        throw new ValidationError(`Missing required document: ${docType}`);
      }
    }

    const cerbosCallId = await withCerbos(
      user,
      {
        kind: 'bond',
        id: bond.id,
        attributes: { status: bond.status, districtCode: bond.holder?.district ?? '' },
      },
      'submit',
    );

    const fabricTxId = await fabric.createBond({
      tdrNumber: bond.tdrNumber,
      surveyNumber: bond.landDetails.surveyNumber,
      holderAadhaarHash: bond.holder!.aadhaarHash,
      extentSqYds: Number(bond.landDetails.tdrIssuedExtentSqYds),
      ratio: bond.landDetails.issuedRatio,
      ipfsDocCid: bond.documents[0]?.ipfsCid ?? '',
    });

    const updated = await prisma.tdrBond.update({
      where: { id: params.id },
      data: { status: BondStatus.PENDING_L1, fabricTxId },
    });

    const result = { bondId: params.id, status: updated.status, fabricTxId, cerbosCallId };

    if (idempotencyKey) {
      await prisma.idempotencyCache.create({
        data: {
          key: idempotencyKey,
          response: JSON.stringify(result),
          expiresAt: new Date(Date.now() + 86400000),
        },
      });
    }

    // AUDIT: Records bond submission to approval chain
    await writeAuditLog({
      bondId: params.id,
      actorId: user.id,
      actorRole: user.role,
      action: 'BOND_SUBMITTED',
      details: { tdrNumber: bond.tdrNumber },
      cerbosCallId,
      fabricTxId,
      ipAddress: getClientIp(req.headers),
    });

    return ok(result);
  },
);
