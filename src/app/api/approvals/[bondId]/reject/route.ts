import { NextRequest } from 'next/server';
import { ApprovalDecision } from '@prisma/client';
import { withErrorHandling } from '@/lib/errors';
import { ok } from '@/lib/api-response';
import { rejectSchema } from '@/lib/validations/approval';
import { processApproval } from '@/lib/approval-handler';

export const POST = withErrorHandling(
  async (req: NextRequest, { params }: { params: { bondId: string } }) => {
    const body = rejectSchema.parse(await req.json());
    const result = await processApproval({
      bondId: params.bondId,
      decision: ApprovalDecision.REJECTED,
      otp: body.otp,
      remarks: body.remarks,
      req,
    });
    return ok(result);
  },
);
