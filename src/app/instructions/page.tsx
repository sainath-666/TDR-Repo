import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { PortalPageShell } from '@/components/layout/PortalPageShell';
import { InstructionsFaq } from '@/components/portal/InstructionsFaq';
import { INSTRUCTIONS_INTRO, PORTAL_FAQ_ITEMS } from '@/lib/faq-content';

export default function InstructionsPage() {
  return (
    <PublicPageLayout>
      <PortalPageShell title="Instructions">
        <div className="mx-auto mb-10 max-w-3xl space-y-4 text-justify text-slate-700">
          <p className="font-semibold text-slate-900">
            Digital Conversion of existing Transferrable Development Right (TDR) Certificate
          </p>
          <p>{INSTRUCTIONS_INTRO}</p>
          <ul className="list-disc space-y-2 pl-5 text-sm">
            <li>TDR area unit is Square Yards only (never square meters).</li>
            <li>TDR ratio (e.g. 1:1, 1.5:1) is authority-decided — not computed by the system.</li>
            <li>Offline bonds require 5-level approval chain.</li>
            <li>G.O. 207 MA&amp;UD · Rule 17 of G.O Ms. No.168 · G.O Ms. No.330</li>
          </ul>
        </div>

        <h2 className="portal-section-title mb-2 text-center">Frequently Asked Questions</h2>
        <div className="portal-section-accent mx-auto mb-8" />
        <InstructionsFaq items={PORTAL_FAQ_ITEMS} />
      </PortalPageShell>
    </PublicPageLayout>
  );
}
