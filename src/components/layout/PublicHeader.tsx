'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Landmark, Menu, X, UserCircle, Wheat, FileEdit, ShieldCheck, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const UTILITY_LINKS = [
  { href: '/verify', label: 'Verify Certificate' },
  { href: '#services', label: 'Services' },
  { href: '#contact', label: 'Contact' },
] as const;

const LOGIN_LINKS = [
  {
    href: '/official-login',
    label: 'Official Login',
    sub: 'Tahsildar · SDC · Commissioner',
    icon: ShieldCheck,
    variant: 'official' as const,
  },
  {
    href: '/farmer-login',
    label: 'Farmer Login',
    sub: 'OTP · Track bonds · Certificates',
    icon: Wheat,
    variant: 'farmer' as const,
  },
  {
    href: '/official-login',
    label: 'DEO Login',
    sub: 'Data entry officers',
    icon: FileEdit,
    variant: 'deo' as const,
  },
] as const;

interface PublicHeaderProps {
  /** Hide login buttons (e.g. when already on a login page) */
  showLogins?: boolean;
}

export function PublicHeader({ showLogins = true }: PublicHeaderProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isHome = pathname === '/';

  return (
    <header className="sticky top-0 z-50 shadow-md">
      {/* Utility bar — government portal style */}
      <div className="bg-apcrda-primary-dark text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex h-8 items-center justify-between text-[11px] sm:text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <span className="hidden sm:inline">Government of Andhra Pradesh</span>
              <span className="sm:hidden">GoAP · APCRDA</span>
              <span className="text-apcrda-secondary/80">|</span>
              <span className="text-apcrda-secondary font-medium">Capital Region</span>
            </div>
            <div className="flex items-center gap-3 sm:gap-5">
              {UTILITY_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-slate-300 hover:text-white transition-colors hidden sm:inline"
                >
                  {link.label}
                </Link>
              ))}
              <Link href="/verify" className="text-slate-300 hover:text-white sm:hidden">
                Verify
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Gold accent strip */}
      <div className="h-1 gradient-gold" />

      {/* Main navigation */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex h-16 sm:h-[4.5rem] items-center justify-between gap-4">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-3 min-w-0 group">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-apcrda-primary text-white shadow-sm group-hover:bg-apcrda-primary-light transition-colors">
                <Landmark className="h-6 w-6 text-apcrda-secondary" strokeWidth={1.75} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-apcrda-secondary leading-tight">
                  APCRDA
                </p>
                <p className="text-sm sm:text-base font-bold text-apcrda-primary leading-tight truncate">
                  TDR Bond Portal
                </p>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              <Link
                href="/"
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  isHome
                    ? 'bg-apcrda-primary/10 text-apcrda-primary'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-apcrda-primary',
                )}
              >
                <span className="flex items-center gap-1.5">
                  <Home className="h-4 w-4" />
                  Home
                </span>
              </Link>
              <Link
                href="/#services"
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-apcrda-primary transition-colors"
              >
                Services
              </Link>
              <Link
                href="/#about"
                className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-apcrda-primary transition-colors"
              >
                About TDR
              </Link>
            </nav>

            {/* Login buttons — desktop */}
            {showLogins && (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  href="/farmer-login"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-apcrda-accent border-2 border-apcrda-accent/30 bg-apcrda-accent/5 hover:bg-apcrda-accent/10 transition-colors"
                >
                  <Wheat className="h-4 w-4" />
                  Farmer
                </Link>
                <Link
                  href="/official-login"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-apcrda-primary hover:bg-apcrda-primary-light shadow-sm transition-colors"
                >
                  <UserCircle className="h-4 w-4" />
                  Official Login
                </Link>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-100 bg-white animate-fade-in">
            <div className="max-w-7xl mx-auto px-4 py-4 space-y-1">
              <Link
                href="/"
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <Home className="h-4 w-4" />
                Home
              </Link>
              <Link
                href="/#services"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Services
              </Link>

              {showLogins && (
                <>
                  <div className="pt-3 pb-1 px-3">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Login
                    </p>
                  </div>
                  {LOGIN_LINKS.map((login) => {
                    const Icon = login.icon;
                    return (
                      <Link
                        key={login.label}
                        href={login.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-slate-50"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-apcrda-primary/10 text-apcrda-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{login.label}</p>
                          <p className="text-xs text-slate-500">{login.sub}</p>
                        </div>
                      </Link>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Login dropdown strip — visible on tablet */}
      {showLogins && (
        <div className="hidden sm:block md:hidden bg-slate-50 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 py-2 flex gap-2 overflow-x-auto">
            {LOGIN_LINKS.map((login) => (
              <Link
                key={login.label}
                href={login.href}
                className="shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold bg-white border border-slate-200 text-apcrda-primary hover:border-apcrda-primary/30"
              >
                {login.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

/** Compact login strip for portal dashboards */
export function PortalLoginStrip() {
  return (
    <div className="bg-apcrda-primary-dark text-white text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex h-7 items-center justify-between">
        <span className="text-slate-400 hidden sm:inline">
          Andhra Pradesh Capital Region Development Authority
        </span>
        <div className="flex items-center gap-4 ml-auto">
          <Link href="/" className="text-slate-300 hover:text-apcrda-secondary transition-colors">
            Public Portal
          </Link>
          <span className="text-slate-600">|</span>
          <Link
            href="/official-login"
            className="text-slate-300 hover:text-white transition-colors"
          >
            Official
          </Link>
          <Link href="/farmer-login" className="text-slate-300 hover:text-white transition-colors">
            Farmer
          </Link>
        </div>
      </div>
    </div>
  );
}
