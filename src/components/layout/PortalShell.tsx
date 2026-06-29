'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, Landmark } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRole } from '@/lib/role-labels';
import type { UserRole } from '@/types';
import { getSidebarNav, type PortalType } from '@/lib/portal-sidebar-nav';
import { LogoutButton } from './LogoutButton';
import { PortalLoginStrip } from './PublicHeader';

export type { PortalType } from '@/lib/portal-sidebar-nav';

const PORTAL_TITLES: Record<PortalType, string> = {
  deo: 'DEO Portal',
  official: 'Official Portal',
  farmer: 'Farmer Portal',
};

interface PortalShellProps {
  portal: PortalType;
  role: UserRole;
  districtCode?: string;
  children: React.ReactNode;
}

export function PortalShell({ portal, role, districtCode, children }: PortalShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navSections = getSidebarNav(portal, role);

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link
        href="/"
        className="flex items-center gap-3 px-5 py-5 border-b border-white/10 hover:bg-white/5 transition-colors"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 ring-1 ring-amber-300/40">
          <Landmark className="h-5 w-5 text-amber-300" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">
            APCRDA
          </p>
          <p className="text-sm font-bold text-white truncate">{PORTAL_TITLES[portal]}</p>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {navSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-white/60">
              {section.title}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== '/' && pathname.startsWith(item.href + '/'));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      active
                        ? 'bg-white/20 text-white shadow-sm ring-1 ring-amber-300/50'
                        : 'text-white/80 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="border-t border-white/15 p-4 space-y-3">
        <div className="rounded-xl bg-black/30 px-3 py-3 ring-1 ring-white/20">
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-white/75">
            Signed in as
          </p>
          <p className="truncate text-sm font-semibold text-white">{formatRole(role)}</p>
          {districtCode && (
            <p className="mt-1 text-xs font-medium text-amber-200">District: {districtCode}</p>
          )}
        </div>
        <LogoutButton />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-50">
      <PortalLoginStrip />
      <div className="h-1 shrink-0 gradient-gold" />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <aside className="hidden md:flex w-64 h-full shrink-0 flex-col gradient-primary shadow-sidebar">
          {sidebar}
        </aside>

        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
        )}

        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 gradient-primary shadow-sidebar transform transition-transform duration-200 md:hidden',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          {sidebar}
        </aside>

        <div className="flex flex-1 flex-col min-h-0 min-w-0 overflow-hidden">
          <header className="z-30 shrink-0 border-b border-slate-200/80 bg-white shadow-header">
            <div className="flex h-11 items-center gap-3 px-3 md:px-4">
              <button
                type="button"
                className="md:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100"
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-apcrda-primary truncate">
                  {PORTAL_TITLES[portal]}
                </p>
                <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                  G.O. 207 MA&amp;UD · LPS Rule 5(4)(B)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-apcrda-primary transition-colors"
                >
                  Public Portal
                </Link>
                <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="h-8 w-8 rounded-full bg-apcrda-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold text-apcrda-primary">
                      {formatRole(role).charAt(0)}
                    </span>
                  </div>
                  <div className="hidden lg:block">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">
                      {formatRole(role)}
                    </p>
                    {districtCode && <p className="text-[10px] text-slate-400">{districtCode}</p>}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="portal-content flex w-full min-h-0 flex-1 flex-col overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
