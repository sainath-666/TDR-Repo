import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { withErrorHandling, AuthenticationError, ValidationError } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { getCurrentUser } from '@/lib/supabase/client';
import { withCerbos } from '@/lib/cerbos/enforce';
import { prisma, withTransaction } from '@/lib/prisma';
import { writeAuditLog } from '@/lib/audit';
import { updateDraftSchema } from '@/lib/validations/bond';
import { hashAadhaar, encryptAadhaar } from '@/lib/security/hmac';
import {
  getBondWithRelations,
  getClientIp,
  getEffectiveBondDistrictCode,
} from '@/lib/bond-helpers';
import { BondStatus } from '@prisma/client';

export const PUT = withErrorHandling(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    const user = await getCurrentUser(cookies());
    if (!user) throw new AuthenticationError();

    const bond = await getBondWithRelations(params.id);
    if (bond.status !== BondStatus.DRAFT) {
      throw new ValidationError('Only DRAFT bonds can be updated');
    }

    const cerbosCallId = await withCerbos(
      user,
      {
        kind: 'bond',
        id: bond.id,
        attributes: { status: bond.status, districtCode: getEffectiveBondDistrictCode(bond) },
      },
      'update',
    );

    const body = updateDraftSchema.parse(await req.json());

    await withTransaction(async (tx) => {
      if (body.phase1) {
        const p1 = body.phase1;
        const updates: Record<string, unknown> = {};
        if (p1.name) updates.name = p1.name;
        if (p1.relationType) updates.relationType = p1.relationType;
        if (p1.relationName) updates.relationName = p1.relationName;
        if (p1.aadhaarNumber) {
          updates.aadhaarHash = hashAadhaar(p1.aadhaarNumber);
          updates.aadhaarEncrypted = encryptAadhaar(p1.aadhaarNumber);
        }
        if (p1.aadhaarPhone) updates.aadhaarPhone = p1.aadhaarPhone;
        if (p1.email !== undefined) updates.email = p1.email || null;
        if (p1.doorNo) updates.doorNo = p1.doorNo;
        if (p1.street) updates.street = p1.street;
        if (p1.village) updates.village = p1.village;
        if (p1.mandal) updates.mandal = p1.mandal;
        if (p1.district) updates.district = p1.district;

        if (Object.keys(updates).length > 0) {
          await tx.bondHolder.update({ where: { bondId: params.id }, data: updates });
        }
      }

      if (body.phase2) {
        const p2 = body.phase2;
        await tx.bondLandDetail.upsert({
          where: { bondId: params.id },
          create: {
            bondId: params.id,
            surrenderedVillage: p2.surrenderedVillage ?? '',
            surveyNumber: p2.surveyNumber ?? '',
            ownershipDeedNo: p2.ownershipDeedNo,
            surrenderedAreaSqYds: p2.surrenderedAreaSqYds ?? 0,
            tdrIssuedExtentSqYds: p2.tdrIssuedExtentSqYds ?? 0,
            issuedRatio: p2.issuedRatio ?? '1:1',
            tdrCertificateNumber: p2.tdrCertificateNumber,
            returnablePlotCode: p2.returnablePlotCode,
          },
          update: {
            ...(p2.surrenderedVillage && { surrenderedVillage: p2.surrenderedVillage }),
            ...(p2.surveyNumber && { surveyNumber: p2.surveyNumber }),
            ...(p2.ownershipDeedNo !== undefined && { ownershipDeedNo: p2.ownershipDeedNo }),
            ...(p2.surrenderedAreaSqYds && { surrenderedAreaSqYds: p2.surrenderedAreaSqYds }),
            ...(p2.tdrIssuedExtentSqYds && { tdrIssuedExtentSqYds: p2.tdrIssuedExtentSqYds }),
            ...(p2.issuedRatio && { issuedRatio: p2.issuedRatio }),
            ...(p2.tdrCertificateNumber !== undefined && {
              tdrCertificateNumber: p2.tdrCertificateNumber,
            }),
            ...(p2.returnablePlotCode !== undefined && {
              returnablePlotCode: p2.returnablePlotCode,
            }),
          },
        });
      }
    });

    await writeAuditLog({
      bondId: params.id,
      actorId: user.id,
      actorRole: user.role,
      action: 'BOND_DRAFT_UPDATED',
      cerbosCallId,
      ipAddress: getClientIp(req.headers),
    });

    return ok({ bondId: params.id, status: BondStatus.DRAFT });
  },
);
