import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import type { NextRequest, NextResponse } from 'next/server';
import { getDevPassword } from '@/lib/dev-auth';
import type { CurrentUser } from '@/types';

export const CITIZEN_SESSION_COOKIE = 'citizen_session';
const SESSION_MAX_AGE_SEC = 30 * 60;

interface CitizenSessionPayload {
  farmerId: string;
  name: string;
  phone: string;
  role: 'FARMER';
  exp: number;
}

function getSessionSecret(): string {
  return process.env.CITIZEN_SESSION_SECRET ?? getDevPassword();
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4;
  const normalized = pad ? padded + '='.repeat(4 - pad) : padded;
  const binary = atob(normalized);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

let cryptoKeyPromise: Promise<CryptoKey> | null = null;

function getCryptoKey(): Promise<CryptoKey> {
  if (!cryptoKeyPromise) {
    cryptoKeyPromise = crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(getSessionSecret()),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify'],
    );
  }
  return cryptoKeyPromise;
}

async function sign(body: string): Promise<string> {
  const key = await getCryptoKey();
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
  return toBase64Url(new Uint8Array(sig));
}

async function verifySignature(body: string, sig: string): Promise<boolean> {
  try {
    const key = await getCryptoKey();
    const sigBytes = Uint8Array.from(fromBase64Url(sig));
    return crypto.subtle.verify('HMAC', key, sigBytes, new TextEncoder().encode(body));
  } catch {
    return false;
  }
}

export async function createCitizenSessionToken(
  payload: Pick<CitizenSessionPayload, 'farmerId' | 'name' | 'phone'>,
): Promise<string> {
  const session: CitizenSessionPayload = {
    ...payload,
    role: 'FARMER',
    exp: Date.now() + SESSION_MAX_AGE_SEC * 1000,
  };
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(session)));
  return `${body}.${await sign(body)}`;
}

export async function parseCitizenSessionToken(
  token: string,
): Promise<CitizenSessionPayload | null> {
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!(await verifySignature(body, sig))) return null;

  try {
    const session = JSON.parse(
      new TextDecoder().decode(fromBase64Url(body)),
    ) as CitizenSessionPayload;
    if (session.role !== 'FARMER' || !session.farmerId || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export function citizenSessionToUser(session: CitizenSessionPayload): CurrentUser {
  return {
    id: session.farmerId,
    role: 'FARMER',
    name: session.name,
    farmerId: session.farmerId,
  };
}

export async function setCitizenSessionCookie(
  response: NextResponse,
  farmer: { id: string; name: string; aadhaarPhone: string },
): Promise<void> {
  const token = await createCitizenSessionToken({
    farmerId: farmer.id,
    name: farmer.name,
    phone: farmer.aadhaarPhone,
  });
  response.cookies.set(CITIZEN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_SEC,
    secure: process.env.NODE_ENV === 'production',
  });
}

export function clearCitizenSessionCookie(response: NextResponse): void {
  response.cookies.delete(CITIZEN_SESSION_COOKIE);
}

export async function getCitizenSessionFromCookies(
  cookieStore: ReadonlyRequestCookies,
): Promise<CurrentUser | null> {
  const token = cookieStore.get(CITIZEN_SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await parseCitizenSessionToken(token);
  return session ? citizenSessionToUser(session) : null;
}

export async function getCitizenSessionFromRequest(
  request: NextRequest,
): Promise<CurrentUser | null> {
  const token = request.cookies.get(CITIZEN_SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await parseCitizenSessionToken(token);
  return session ? citizenSessionToUser(session) : null;
}

export function isCitizenOnlyRoute(pathname: string): boolean {
  return (
    pathname.startsWith('/farmer') ||
    pathname.startsWith('/api/bonds/farmer') ||
    pathname.startsWith('/api/dashboard/farmer')
  );
}

export function isSharedCitizenApiRoute(pathname: string): boolean {
  return (
    !!pathname.match(/^\/api\/bonds\/[^/]+$/) ||
    !!pathname.match(/^\/api\/certificates\/[^/]+\/download$/) ||
    !!pathname.match(/^\/api\/documents\/[^/]+$/)
  );
}
