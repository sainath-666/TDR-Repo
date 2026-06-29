import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { DEV_PASSWORD, officialDevEmail } from '@/lib/supabase/auth-users';

/** Dev-only: list seeded officials for login hints */
export async function GET() {
  if (process.env.NODE_ENV === 'production' && process.env.AUTH_DEV_MODE !== 'true') {
    return NextResponse.json({ success: false, error: 'Not available' }, { status: 404 });
  }

  const officials = await prisma.official.findMany({
    where: { isActive: true },
    orderBy: { employeeId: 'asc' },
    select: { employeeId: true, name: true, role: true },
  });

  return NextResponse.json({
    success: true,
    devPassword: DEV_PASSWORD,
    data: officials.map((o) => ({
      email: officialDevEmail(o.employeeId),
      name: o.name,
      role: o.role,
    })),
  });
}
