import { cache } from 'react';
import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import type { User } from '@supabase/supabase-js';
import type { CurrentUser, UserRole } from '@/types';
import { isOfficialRole } from '@/types';
import { prisma } from '@/lib/prisma';
import { getCitizenSessionFromCookies } from '@/lib/citizen-session';

export { createAdminClient } from './admin';

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  return url;
}

function getSupabaseAnonKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
  return key;
}

export function createServerClient(cookieStore: ReadonlyRequestCookies) {
  return createSupabaseServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component — cookie setting handled by middleware
        }
      },
    },
  });
}

function normalizeRole(role: string | undefined): UserRole | undefined {
  if (!role) return undefined;
  const upper = role.toUpperCase() as UserRole;
  if (upper === 'FARMER' || isOfficialRole(upper)) return upper;
  return undefined;
}

async function resolveOfficialFromPrisma(userId: string): Promise<CurrentUser | null> {
  const official = await prisma.official.findUnique({ where: { id: userId } });
  if (!official?.isActive) return null;

  return {
    id: userId,
    role: official.role as UserRole,
    name: official.name,
    districtCode: official.districtCode,
    employeeId: official.employeeId,
  };
}

async function resolveOfficialFromSupabaseUser(user: User): Promise<CurrentUser | null> {
  const meta = user.app_metadata as Record<string, string | undefined>;
  const userMeta = user.user_metadata as Record<string, string | undefined>;
  const displayName = typeof userMeta.name === 'string' ? userMeta.name : undefined;
  const role = normalizeRole(meta.role);

  if (role === 'FARMER') return null;

  if (role && isOfficialRole(role)) {
    if (displayName && meta.district_code && meta.employee_id) {
      return {
        id: user.id,
        role,
        name: displayName,
        districtCode: meta.district_code,
        employeeId: meta.employee_id,
        farmerId: meta.farmer_id,
      };
    }

    const official = await prisma.official.findUnique({
      where: { id: user.id },
      select: { name: true, districtCode: true, employeeId: true, isActive: true, role: true },
    });
    if (official?.isActive) {
      return {
        id: user.id,
        role: (official.role as UserRole) ?? role,
        name: official.name ?? displayName,
        districtCode: meta.district_code ?? official.districtCode,
        employeeId: meta.employee_id ?? official.employeeId,
        farmerId: meta.farmer_id,
      };
    }
  }

  return resolveOfficialFromPrisma(user.id);
}

/** Request-scoped: layout + page share one auth lookup. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const store = cookies();

  const supabase = createServerClient(store);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  // Official session wins over a stale farmer cookie (e.g. after switching portals).
  if (!error && user) {
    const official = await resolveOfficialFromSupabaseUser(user);
    if (official) return official;
  }

  const citizen = await getCitizenSessionFromCookies(store);
  if (citizen) return citizen;

  if (error || !user) return null;

  const meta = user.app_metadata as Record<string, string | undefined>;
  const userMeta = user.user_metadata as Record<string, string | undefined>;
  const displayName = typeof userMeta.name === 'string' ? userMeta.name : undefined;
  const role = normalizeRole(meta.role);

  if (role === 'FARMER') return null;

  if (role) {
    return {
      id: user.id,
      role,
      name: displayName,
      districtCode: meta.district_code,
      employeeId: meta.employee_id,
      farmerId: meta.farmer_id,
    };
  }

  return resolveOfficialFromPrisma(user.id);
});
