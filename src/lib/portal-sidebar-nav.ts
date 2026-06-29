import { LayoutDashboard, FilePlus, ClipboardList, BarChart3, type LucideIcon } from 'lucide-react';
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
  if (portal === 'deo') {
    return [
      {
        title: 'Menu',
        items: [
          { href: '/deo/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { href: '/deo/bonds/new', label: 'New Bond Entry', icon: FilePlus },
        ],
      },
    ];
  }

  if (portal === 'farmer') {
    return [
      {
        title: 'Menu',
        items: [
          { href: '/farmer/dashboard', label: 'My Bonds', icon: LayoutDashboard },
          { href: '/status', label: 'Track Status', icon: BarChart3 },
        ],
      },
    ];
  }

  return [
    {
      title: 'Menu',
      items: [
        { href: '/official/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/official/queue', label: 'Approval Queue', icon: ClipboardList },
      ],
    },
  ];
}
