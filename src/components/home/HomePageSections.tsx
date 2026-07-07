'use client';

import { cn } from '@/lib/utils';
import { useLocale } from '@/lib/i18n/locale-context';

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-8 text-center">
      <h2 className="portal-section-title">{title}</h2>
      <div className="portal-section-accent" />
    </div>
  );
}

function ContentSection({
  id,
  title,
  children,
  muted = false,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
  muted?: boolean;
}) {
  return (
    <section id={id} className={cn(muted ? 'portal-section-muted' : 'portal-section')}>
      <div className="portal-content-block">
        <SectionHeader title={title} />
        {children}
      </div>
    </section>
  );
}

export function HomePageSections() {
  const { t } = useLocale();

  return (
    <>
      <ContentSection id="about-apcrda" title={t.about.apcrdaTitle}>
        <div className="portal-prose text-justify">
          <p>{t.about.apcrdaP1}</p>
          <p>{t.about.apcrdaP2}</p>
          <p>{t.about.apcrdaP3}</p>
        </div>
      </ContentSection>

      <ContentSection id="about-tdr" title={t.about.tdrTitle} muted>
        <p className="mx-auto max-w-3xl text-center text-lg leading-relaxed text-slate-600">
          {t.about.tdrBody}
        </p>
      </ContentSection>
    </>
  );
}
