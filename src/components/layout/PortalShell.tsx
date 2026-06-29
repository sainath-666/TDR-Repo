'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FilePlus,
  ClipboardList,
  Menu,
  X,
  Landmark,
  Home,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRole } from '@/lib/role-labels';
import type { UserRole } from '@/types';
import { LogoutButton } from './LogoutButton';
import { PortalLoginStrip } from './PublicHeader';

export type PortalType = 'deo' | 'official' | 'farmer';

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const PORTAL_NAV: Record<PortalType, NavItem[]> = {
  deo: [
    { href: '/deo/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/deo/bonds/new', label: 'New Bond Entry', icon: FilePlus },
  ],
  official: [{ href: '/official/queue', label: 'Approval Queue', icon: ClipboardList }],
  farmer: [{ href: '/farmer/dashboard', label: 'My Bonds', icon: LayoutDashboard }],
};

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
  const navItems = PORTAL_NAV[portal];

  const sidebar = (
    <div className="flex h-full flex-col">
      <Link
        href="/"
        className="flex items-center gap-3 px-5 py-5 border-b border-white/10 hover:bg-white/5 transition-colors"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-apcrda-secondary/20 ring-1 ring-apcrda-secondary/30">
          <Landmark className="h-5 w-5 text-apcrda-secondary" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-apcrda-secondary">
            APCRDA
          </p>
          <p className="text-sm font-bold text-white truncate">{PORTAL_TITLES[portal]}</p>
        </div>
      </Link>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Navigation
        </p>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                active
                  ? 'bg-apcrda-secondary/20 text-apcrda-secondary ring-1 ring-apcrda-secondary/30'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-4 space-y-3">
        <div className="rounded-xl bg-white/5 ring-1 ring-white/10 px-3 py-3">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Signed in as</p>
          <p className="text-sm font-semibold text-white truncate">{formatRole(role)}</p>
          {districtCode && (
            <p className="text-[11px] text-apcrda-secondary/80 mt-0.5">District: {districtCode}</p>
          )}
        </div>
        <LogoutButton />
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <PortalLoginStrip />
      <div className="h-0.5 gradient-gold shrink-0" />

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex w-64 flex-col bg-apcrda-primary-dark shadow-sidebar shrink-0">
          {sidebar}
        </aside>

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden
          />
        )}

        {/* Mobile sidebar */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-64 bg-apcrda-primary-dark shadow-sidebar transform transition-transform duration-200 md:hidden',
            mobileOpen ? 'translate-x-0' : '-translate-x-full',
          )}
        >
          {sidebar}
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col min-w-0">
          <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm">
            <div className="flex h-14 items-center gap-4 px-4 md:px-6">
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
                  <Home className="h-3.5 w-3.5" />
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

          <main className="portal-content max-w-7xl w-full mx-auto">{children}</main>
        </div>
      </div>
    </div>
  );
}
