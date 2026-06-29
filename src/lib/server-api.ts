import { headers } from 'next/headers';

interface ApiSuccess<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Server-side fetch to this app's JSON APIs (same DB-backed routes the UI uses) */
export async function fetchAppApi<T>(path: string, init?: RequestInit): Promise<T> {
  const headerList = headers();
  const host = headerList.get('x-forwarded-host') ?? headerList.get('host') ?? 'localhost:3000';
  const protocol = headerList.get('x-forwarded-proto') ?? 'http';
  const url = `${protocol}://${host}${path}`;

  const res = await fetch(url, { cache: 'no-store', ...init });
  const json = (await res.json()) as ApiSuccess<T>;

  if (!res.ok || !json.success || json.data === undefined) {
    throw new Error(json.error ?? `API request failed: ${path}`);
  }

  return json.data;
}
