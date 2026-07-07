'use client';

import { PortalPageShell } from '@/components/layout/PortalPageShell';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/lib/i18n/locale-context';

export function HowToApplyContent() {
  const { t } = useLocale();

  return (
    <PortalPageShell title={t.howToApply.title} subtitle={t.howToApply.subtitle}>
      <p className="mb-8 text-center text-slate-600">{t.howToApply.intro}</p>

      <ol className="mx-auto mb-10 max-w-2xl space-y-3">
        {t.howToApply.steps.map((step, i) => (
          <li
            key={step}
            className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-card"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: 'var(--portal-purple)' }}
            >
              {i + 1}
            </span>
            <span className="pt-1 text-slate-700">{step}</span>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap justify-center gap-3">
        <Button href="/farmer-login" size="lg" className="bg-[var(--portal-purple)]">
          {t.howToApply.applyNow}
        </Button>
        <Button
          href="/official-login"
          variant="outline"
          size="lg"
          className="border-[var(--portal-purple)] text-[var(--portal-purple)]"
        >
          {t.howToApply.officerLogin}
        </Button>
      </div>
    </PortalPageShell>
  );
}
