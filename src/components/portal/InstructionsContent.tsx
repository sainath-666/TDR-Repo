'use client';

import { PortalPageShell } from '@/components/layout/PortalPageShell';
import { InstructionsFaq } from '@/components/portal/InstructionsFaq';
import { useLocale } from '@/lib/i18n/locale-context';

export function InstructionsContent() {
  const { t } = useLocale();

  return (
    <PortalPageShell title={t.instructions.title}>
      <div className="mx-auto mb-10 max-w-3xl space-y-4 text-justify text-slate-700">
        <p className="font-semibold text-slate-900">{t.instructions.heading}</p>
        <p>{t.instructions.intro}</p>
        <ul className="list-disc space-y-2 pl-5 text-sm">
          {t.instructions.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </div>

      <h2 className="portal-section-title mb-2 text-center">{t.instructions.faqTitle}</h2>
      <div className="portal-section-accent mx-auto mb-8" />
      <InstructionsFaq items={t.instructions.faq} />
    </PortalPageShell>
  );
}
