'use client';

import { PortalPageShell } from '@/components/layout/PortalPageShell';
import { StatusLookup } from '@/components/portal/StatusLookup';
import { useLocale } from '@/lib/i18n/locale-context';

export function StatusContent() {
  const { t } = useLocale();

  return (
    <PortalPageShell title={t.statusPage.title}>
      <StatusLookup />
    </PortalPageShell>
  );
}
