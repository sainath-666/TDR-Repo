import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** Dev-only: list seeded farmers for quick login */
export async function GET() {
  if (process.env.NODE_ENV === 'production' && process.env.AUTH_DEV_MODE !== 'true') {
    return NextResponse.json({ success: false, error: 'Not available' }, { status: 404 });
  }

  const farmers = await prisma.farmer.findMany({
    orderBy: { name: 'asc' },
    select: { name: true, aadhaarPhone: true },
  });

  return NextResponse.json({ success: true, data: farmers });
}
