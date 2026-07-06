import { NextRequest, NextResponse } from 'next/server';
import { BondStatus } from '@prisma/client';
import { withErrorHandling, AuthenticationError, ValidationError } from '@/lib/errors';
import { getCurrentUser } from '@/lib/supabase/client';
import { withCerbos } from '@/lib/cerbos/enforce';
import { getBondWithRelations, getClientIp } from '@/lib/bond-helpers';
import { writeAuditLog } from '@/lib/audit';
import { readBondCertificatePdf, generateBondCertificatePdfBuffer } from '@/lib/certificate/mint';

export const GET = withErrorHandling(
  async (req: NextRequest, { params }: { params: { bondId: string } }) => {
    const user = await getCurrentUser();
    if (!user) throw new AuthenticationError();

    const bond = await getBondWithRelations(params.bondId);

    const cerbosCallId = await withCerbos(
      user,
      {
        kind: 'certificate',
        id: params.bondId,
        attributes: { bondStatus: bond.status, farmerId: bond.farmerId },
      },
      'download',
    );

    if (bond.status !== BondStatus.ACTIVE) {
      throw new ValidationError('Certificate not available yet');
    }

    const verifyOrigin = new URL(req.url).origin;
    let pdfBuffer: Buffer;

    try {
      // Regenerate from current bond data so download matches the on-screen preview.
      pdfBuffer = await generateBondCertificatePdfBuffer(bond, verifyOrigin);
    } catch {
      if (!bond.certificateStoragePath) {
        throw new ValidationError('Certificate not available yet');
      }
      pdfBuffer = await readBondCertificatePdf(params.bondId, bond.certificateStoragePath);
    }

    // AUDIT: Records farmer or official certificate PDF download
    await writeAuditLog({
      bondId: params.bondId,
      actorId: user.id,
      actorRole: user.role,
      action: 'CERT_DOWNLOADED',
      cerbosCallId,
      ipAddress: getClientIp(req.headers),
    });

    const filename = `${bond.tdrNumber.replace(/[^a-zA-Z0-9-]/g, '_')}-certificate.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(pdfBuffer.length),
        'Cache-Control': 'private, no-store',
      },
    });
  },
);
