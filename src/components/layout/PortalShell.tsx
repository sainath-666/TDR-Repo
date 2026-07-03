'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRole } from '@/lib/role-labels';
import type { UserRole } from '@/types';
import { getSidebarNav, type PortalType } from '@/lib/portal-sidebar-nav';
import { LogoutButton } from './LogoutButton';

export type { PortalType } from '@/lib/portal-sidebar-nav';

const PORTAL_TITLES: Record<PortalType, string> = {
  deo: 'DEO Portal',
  official: 'Official Portal',
  farmer: 'My Bonds',
};

interface PortalShellProps {
  portal: PortalType;
  role: UserRole;
  userName?: string;
  districtCode?: string;
  children: React.ReactNode;
}

function userInitial(role: UserRole, userName?: string): string {
  if (userName?.trim()) return userName.trim().charAt(0).toUpperCase();
  return formatRole(role).charAt(0);
}

export function PortalShell({ portal, role, userName, districtCode, children }: PortalShellProps) {
  const pathname = usePathname();
  const navItems = getSidebarNav(portal, role).flatMap((section) => section.items);
  const showNav = navItems.length > 1;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <header className="z-30 shrink-0 border-b border-slate-200/80 bg-white shadow-header">
        <div className="flex h-12 items-center gap-3 px-3 md:px-5">
          <Link href="/" className="flex items-center gap-2.5 min-w-0 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-apcrda-primary/10 ring-1 ring-apcrda-primary/20">
              <Landmark className="h-4 w-4 text-apcrda-primary" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 leading-none">
                APCRDA
              </p>
              <p className="text-sm font-bold text-apcrda-primary truncate leading-tight">
                {PORTAL_TITLES[portal]}
              </p>
            </div>
          </Link>

          {showNav && (
            <nav className="hidden md:flex items-center gap-1 flex-1 min-w-0 px-2">
              {navItems.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href + '/'));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                      active
                        ? 'bg-apcrda-primary/10 text-apcrda-primary'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-apcrda-primary',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}

          <div className="flex-1 min-w-0 sm:hidden" />

          <div className="flex items-center gap-2 sm:gap-3 ml-auto shrink-0">
            <Link
              href="/"
              className="hidden sm:inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-apcrda-primary transition-colors"
            >
              Public Portal
            </Link>

            <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
              <div className="h-8 w-8 rounded-full bg-apcrda-primary/10 flex items-center justify-center">
                <span className="text-xs font-bold text-apcrda-primary">
                  {userInitial(role, userName)}
                </span>
              </div>
              <div className="hidden sm:block min-w-0 max-w-[160px] md:max-w-[200px]">
                <p className="text-xs font-semibold text-slate-800 leading-tight truncate">
                  {userName ?? formatRole(role)}
                </p>
                <p className="text-[10px] text-slate-500 leading-tight truncate">
                  {userName ? formatRole(role) : null}
                  {userName && districtCode ? ' · ' : null}
                  {districtCode ?? null}
                </p>
              </div>
            </div>

            <LogoutButton
              className={cn(
                'w-auto border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700',
                'hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900',
              )}
            />
          </div>
        </div>

        {showNav && (
          <nav className="flex md:hidden items-center gap-1 overflow-x-auto border-t border-slate-100 px-3 py-1.5">
            {navItems.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href + '/'));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                    active
                      ? 'bg-apcrda-primary/10 text-apcrda-primary'
                      : 'text-slate-600 hover:bg-slate-100',
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}
      </header>

      <main className="portal-content flex w-full min-h-0 flex-1 flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
