import { LayoutDashboard, type LucideIcon } from 'lucide-react';
import type { UserRole } from '@/types';

export type PortalType = 'deo' | 'official' | 'farmer';

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface SidebarNavSection {
  title: string;
  items: SidebarNavItem[];
}

export function getSidebarNav(portal: PortalType, role: UserRole): SidebarNavSection[] {
  void role;
  if (portal === 'deo') {
    return [
      {
        title: 'Menu',
        items: [{ href: '/deo/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
      },
    ];
  }

  if (portal === 'farmer') {
    return [
      {
        title: 'Menu',
        items: [{ href: '/farmer/dashboard', label: 'My Bonds', icon: LayoutDashboard }],
      },
    ];
  }

  return [
    {
      title: 'Menu',
      items: [{ href: '/official/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
    },
  ];
}
