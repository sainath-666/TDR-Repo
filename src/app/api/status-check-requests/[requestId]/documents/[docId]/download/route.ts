import { NextRequest, NextResponse } from 'next/server';
import {
  withErrorHandling,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
} from '@/lib/errors';
import { getCurrentUser } from '@/lib/supabase/client';
import { prisma } from '@/lib/prisma';
import { downloadStatusInquiryDocument } from '@/lib/status-inquiry-storage';

function canAccessStatusCheckRequests(role: string | undefined): boolean {
  return role === 'DEO' || role === 'SURVEYOR';
}

export const GET = withErrorHandling(
  async (_req: NextRequest, { params }: { params: { requestId: string; docId: string } }) => {
    const user = await getCurrentUser();
    if (!user) throw new AuthenticationError();
    if (!canAccessStatusCheckRequests(user.role)) {
      throw new AuthorizationError('Only DEO users can download status check documents');
    }

    const document = await prisma.tdrStatusCheckDocument.findFirst({
      where: {
        id: params.docId,
        requestId: params.requestId,
      },
    });

    if (!document) throw new NotFoundError('status check document', params.docId);

    const fileBuffer = await downloadStatusInquiryDocument(document.storagePath);
    const safeName = document.fileName.replace(/[^a-zA-Z0-9._-]/g, '_') || 'document';

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': document.contentType,
        'Content-Disposition': `attachment; filename="${safeName}"`,
        'Content-Length': String(fileBuffer.length),
        'Cache-Control': 'private, no-store',
      },
    });
  },
);
