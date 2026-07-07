'use client';

import { PortalPageShell } from '@/components/layout/PortalPageShell';
import { TdrCalculator } from '@/components/portal/TdrCalculator';
import { useLocale } from '@/lib/i18n/locale-context';

export function CalculatorContent() {
  const { t } = useLocale();

  return (
    <PortalPageShell title={t.calculator.title}>
      <TdrCalculator />
    </PortalPageShell>
  );
}
