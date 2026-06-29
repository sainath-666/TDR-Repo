import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { PortalPageShell } from '@/components/layout/PortalPageShell';
import { Button } from '@/components/ui/Button';
import { HOW_TO_APPLY_STEPS } from '@/lib/faq-content';

export default function HowToApplyPage() {
  return (
    <PublicPageLayout>
      <PortalPageShell
        title="How To Apply"
        subtitle="TDR application may be submitted by a Citizen or APCRDA Officer."
      >
        <p className="mb-8 text-center text-slate-600">
          Any Citizen who is surrendering / has surrendered his land, free of cost, to APCRDA for
          public purpose may apply to avail &apos;Transferable Development Right&apos; Certificate.
        </p>

        <ol className="mx-auto mb-10 max-w-2xl space-y-3">
          {HOW_TO_APPLY_STEPS.map((step, i) => (
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
            Apply Now — Citizen Login
          </Button>
          <Button
            href="/official-login"
            variant="outline"
            size="lg"
            className="border-[var(--portal-purple)] text-[var(--portal-purple)]"
          >
            Officer Login
          </Button>
        </div>
      </PortalPageShell>
    </PublicPageLayout>
  );
}
