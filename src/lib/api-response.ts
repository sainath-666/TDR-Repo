import { NextResponse } from 'next/server';
import type { PaginatedResponse } from '@/types';

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ success: true, data }, { status });
}

export function created<T>(data: T): NextResponse {
  return ok(data, 201);
}

export function noContent(): NextResponse {
  return new NextResponse(null, { status: 204 });
}

export function paginated<T>(items: T[], total: number, page: number, limit: number): NextResponse {
  const response: PaginatedResponse<T> = {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
  return ok(response);
}

export function error(
  message: string,
  status: number,
  code?: string,
  fields?: Record<string, string>,
): NextResponse {
  return NextResponse.json({ success: false, error: message, code, fields }, { status });
}
