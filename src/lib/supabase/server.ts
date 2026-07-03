import { createServerClient as createSupabaseServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
import type { CurrentUser, UserRole } from '@/types';
import { isOfficialRole } from '@/types';
import { prisma } from '@/lib/prisma';

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

export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set');
  return createClient(getSupabaseUrl(), serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function parsePhoneFromAuthUser(phone: string | undefined): string | undefined {
  if (!phone) return undefined;
  return phone.replace(/^\+91/, '');
}

async function resolveUserFromPrisma(
  userId: string,
  phone: string | undefined,
  displayName?: string,
): Promise<CurrentUser | null> {
  const official = await prisma.official.findUnique({ where: { id: userId } });
  if (official?.isActive) {
    return {
      id: userId,
      role: official.role as UserRole,
      name: official.name,
      districtCode: official.districtCode,
      employeeId: official.employeeId,
    };
  }

  const farmerById = await prisma.farmer.findUnique({ where: { id: userId } });
  if (farmerById) {
    return { id: userId, role: 'FARMER', name: farmerById.name, farmerId: farmerById.id };
  }

  const normalizedPhone = parsePhoneFromAuthUser(phone);
  if (normalizedPhone) {
    const farmerByPhone = await prisma.farmer.findFirst({
      where: { aadhaarPhone: normalizedPhone },
    });
    if (farmerByPhone) {
      return {
        id: userId,
        role: 'FARMER',
        name: farmerByPhone.name,
        farmerId: farmerByPhone.id,
      };
    }
  }

  if (displayName) {
    return { id: userId, role: 'FARMER', name: displayName };
  }

  return null;
}

export async function getCurrentUser(
  cookieStore?: ReadonlyRequestCookies,
): Promise<CurrentUser | null> {
  const store = cookieStore ?? cookies();
  const supabase = createServerClient(store);
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const meta = user.app_metadata as Record<string, string | undefined>;
  const userMeta = user.user_metadata as Record<string, string | undefined>;
  const displayName = typeof userMeta.name === 'string' ? userMeta.name : undefined;
  const role = meta.role as UserRole | undefined;

  if (role) {
    if (isOfficialRole(role)) {
      const official = await prisma.official.findUnique({
        where: { id: user.id },
        select: { name: true, districtCode: true, employeeId: true, isActive: true },
      });
      if (official?.isActive) {
        return {
          id: user.id,
          role,
          name: official.name ?? displayName,
          districtCode: meta.district_code ?? official.districtCode,
          employeeId: meta.employee_id ?? official.employeeId,
          farmerId: meta.farmer_id,
        };
      }
    }

    if (role === 'FARMER') {
      const farmerId = meta.farmer_id;
      const phone = parsePhoneFromAuthUser(user.phone);
      const farmer = farmerId
        ? await prisma.farmer.findUnique({
            where: { id: farmerId },
            select: { name: true },
          })
        : phone
          ? await prisma.farmer.findFirst({
              where: { aadhaarPhone: phone },
              select: { name: true },
            })
          : null;
      return {
        id: user.id,
        role,
        name: farmer?.name ?? displayName,
        districtCode: meta.district_code,
        employeeId: meta.employee_id,
        farmerId: meta.farmer_id,
      };
    }

    return {
      id: user.id,
      role,
      name: displayName,
      districtCode: meta.district_code,
      employeeId: meta.employee_id,
      farmerId: meta.farmer_id,
    };
  }

  // Fallback: JWT may lack claims before auth hook / sync — resolve from Prisma
  return resolveUserFromPrisma(user.id, user.phone, displayName);
}
