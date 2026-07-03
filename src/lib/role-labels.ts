import type { UserRole } from '@/types';

export const ROLE_LABELS: Record<UserRole, string> = {
  DEO: 'Data Entry Operator',
  SURVEYOR: 'Surveyor',
  DY_TAHSILDAR: 'Deputy Tahsildar',
  TAHSILDAR: 'Tahsildar',
  SDC: 'Sub-Divisional Collector',
  DIRECTOR_LANDS: 'Director (Lands)',
  ADDL_COMMISSIONER: 'Additional Commissioner',
  COMMISSIONER: 'Commissioner',
  FARMER: 'Farmer',
};

export function formatRole(role: UserRole): string {
  return ROLE_LABELS[role] ?? role;
}
