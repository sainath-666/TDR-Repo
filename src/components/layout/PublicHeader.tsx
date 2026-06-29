'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  Landmark,
  Bell,
  HelpCircle,
  Calculator,
  BarChart3,
  LogIn,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ApStateEmblem, AmaravatiLogo } from '@/components/layout/GovLogos';

const NAV_ITEMS = [
  { href: '/', label: 'HOME', icon: Home },
  {
    label: 'APPLICATION',
    icon: FileText,
    matchPrefixes: ['/farmer-login', '/application'],
    children: [
      { href: '/farmer-login', label: 'Apply Now' },
      { href: '/application/how-to-apply', label: 'How To Apply' },
    ],
  },
  { href: '/tdr-bank', label: 'TDR BANK', icon: Landmark },
  { href: '/verify', label: 'TDR VERIFICATION', icon: Bell },
  { href: '/instructions', label: 'INSTRUCTIONS', icon: HelpCircle },
  { href: '/calculator', label: 'CALCULATOR', icon: Calculator },
  { href: '/status', label: 'STATUS', icon: BarChart3, badge: 'NEW' as const },
  {
    label: 'SIGN IN',
    icon: LogIn,
    matchPrefixes: ['/official-login', '/farmer-login'],
    children: [
      { href: '/official-login', label: 'Officer Login' },
      { href: '/farmer-login', label: 'Citizen Login' },
    ],
  },
] as const;

function isNavActive(pathname: string, href: string): boolean {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isDropdownActive(
  pathname: string,
  children: readonly { href: string }[],
  matchPrefixes?: readonly string[],
): boolean {
  if (children.some((child) => isNavActive(pathname, child.href))) return true;
  if (matchPrefixes?.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))) {
    return true;
  }
  return false;
}

function NavDropdown({
  label,
  icon: Icon,
  children,
  mobile,
  onNavigate,
  active,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: readonly { href: string; label: string }[];
  mobile?: boolean;
  onNavigate?: () => void;
  active?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateMenuPosition = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom,
      left: rect.left,
      minWidth: '210px',
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    updateMenuPosition();
    window.addEventListener('resize', updateMenuPosition);
    window.addEventListener('scroll', updateMenuPosition, true);
    return () => {
      window.removeEventListener('resize', updateMenuPosition);
      window.removeEventListener('scroll', updateMenuPosition, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (mobile) {
    return (
      <div className="border-b border-white/15">
        <p className="px-4 py-2 text-xs font-bold text-white/80 flex items-center gap-2 uppercase">
          <Icon className="h-4 w-4" />
          {label}
        </p>
        {children.map((child) => (
          <Link
            key={child.href}
            href={child.href}
            onClick={onNavigate}
            className="block px-6 py-2.5 text-sm text-white hover:bg-white/10"
          >
            {child.label}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <div className="relative shrink-0">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => {
          if (!open) updateMenuPosition();
          setOpen((prev) => !prev);
        }}
        className={cn('gov-nav-link', active && 'gov-nav-link-active')}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Icon className="h-4 w-4 shrink-0 opacity-90" />
        {label}
        <ChevronDown className={cn('h-3 w-3 opacity-80', open && 'rotate-180')} />
      </button>
      {open &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="rounded-sm border border-slate-200 bg-white py-1 shadow-xl"
            role="menu"
          >
            {children.map((child) => (
              <Link
                key={child.href}
                href={child.href}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="block px-4 py-2.5 text-sm text-slate-800 hover:bg-[#f5f0f8] hover:text-[#7d007d]"
              >
                {child.label}
              </Link>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

export function PublicHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="relative z-50 shadow-md">
      {/* Official white brand band */}
      <div className="gov-header-brand">
        <div className="max-w-[1280px] mx-auto px-3 sm:px-6">
          <div className="grid grid-cols-[auto_1fr_auto] gap-3 sm:gap-8 items-center">
            <div className="flex flex-col items-center gap-1.5">
              <ApStateEmblem className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24" />
              <select
                defaultValue="en"
                className="text-[11px] border border-slate-400 rounded-sm px-1.5 py-0.5 text-slate-700 bg-white min-w-[72px]"
                aria-label="Language"
              >
                <option value="en">English</option>
                <option value="te">తెలుగు</option>
              </select>
            </div>

            <div className="text-center min-w-0 px-1 sm:px-2">
              <p className="gov-header-title text-[0.7rem] leading-tight sm:text-base md:text-xl lg:text-[1.65rem] xl:text-[2rem]">
                Andhra Pradesh Capital Region Development Authority
              </p>
              <p className="gov-header-title-te mt-1 text-[0.65rem] sm:text-sm md:text-lg lg:text-[1.4rem] xl:text-[1.65rem]">
                ఆంధ్ర ప్రదేశ్ రాజధాని ప్రాంత అభివృద్ధి ప్రాధికార సంస్థ
              </p>
              <p className="gov-header-tdr mt-1.5 text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl">
                Transferable Development Rights-TDR
              </p>
            </div>

            <div className="flex justify-end">
              <AmaravatiLogo className="h-16 w-auto sm:h-20 md:h-24" />
            </div>
          </div>
        </div>
      </div>

      {/* Purple navigation — full width, official style */}
      <div className="gov-nav-bar overflow-visible">
        <div className="max-w-[1140px] mx-auto flex h-12 items-center overflow-visible px-2">
          <nav className="hidden md:flex flex-1 flex-wrap items-center justify-center overflow-visible">
            {NAV_ITEMS.map((item) => {
              if ('children' in item && item.children) {
                const dropdownActive = isDropdownActive(
                  pathname,
                  item.children,
                  'matchPrefixes' in item ? item.matchPrefixes : undefined,
                );
                return (
                  <NavDropdown
                    key={item.label}
                    label={item.label}
                    icon={item.icon}
                    children={item.children}
                    active={dropdownActive}
                  />
                );
              }
              const href = 'href' in item ? item.href : '/';
              const Icon = item.icon;
              const active = isNavActive(pathname, href);
              const badge = 'badge' in item ? item.badge : undefined;
              return (
                <Link
                  key={item.label}
                  href={href}
                  className={cn('gov-nav-link relative shrink-0', active && 'gov-nav-link-active')}
                >
                  <Icon className="h-4 w-4 shrink-0 opacity-90" />
                  {item.label}
                  {badge && (
                    <span className="absolute -top-1 right-1 bg-[#2563eb] text-white text-[8px] font-bold px-1 py-px rounded-sm leading-none">
                      {badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          <button
            type="button"
            className="md:hidden ml-auto p-2 text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-white/20 pb-2">
            {NAV_ITEMS.map((item) => {
              if ('children' in item && item.children) {
                return (
                  <NavDropdown
                    key={item.label}
                    label={item.label}
                    icon={item.icon}
                    children={item.children}
                    mobile
                    onNavigate={() => setMobileOpen(false)}
                  />
                );
              }
              const href = 'href' in item ? item.href : '/';
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 text-sm font-bold text-white hover:bg-white/10 uppercase border-b border-white/10"
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}

export function PortalLoginStrip() {
  return (
    <div className="gov-nav-bar text-xs">
      <div className="max-w-[1140px] mx-auto px-4 flex h-7 items-center justify-end gap-4 text-white/90">
        <Link href="/" className="hover:text-white">
          Home
        </Link>
        <Link href="/official-login" className="hover:text-white">
          Officer
        </Link>
        <Link href="/farmer-login" className="hover:text-white">
          Citizen
        </Link>
      </div>
    </div>
  );
}
