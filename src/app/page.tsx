import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { LandingQuickActions } from '@/components/home/LandingQuickActions';
import { cn } from '@/lib/utils';

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

export default function HomePage() {
  return (
    <PublicPageLayout>
      <HeroCarousel />
      <LandingQuickActions />

      <ContentSection id="about-apcrda" title="About APCRDA">
        <div className="portal-prose text-justify">
          <p>
            In February 2014, the state of Andhra Pradesh was bifurcated, leading to need for a new
            capital city in successor state of AP. As per the AP Reorganization Act 2014, a new
            greenfield capital was to be developed for the state of Andhra Pradesh. Hence, it was
            planned to construct a new greenfield capital &quot;Amaravati&quot; through LPS (Land
            Pooling Scheme) with active involvement of people.
          </p>
          <p>
            The concept of land pooling was adopted where farmers/land owners (over and above 25,000
            unique farmers) were appealed to pool their land (over and above 30,000 acres) to fulfil
            the land requirement to set up the people&apos;s capital in Amaravati. In return, Govt.
            of Andhra Pradesh promised to give them developed plots (residential and commercial) in
            a proportionate ratio of land pooled by them as per the predefined guidelines.
          </p>
          <p>
            As per APCRDA Act - 2014, CHAPTER I (41) it is defined that the &apos;transferable
            development right&apos; means a development right to transfer the potential of a plot
            designated for a public purpose in a plan, expressed in terms of total permissible built
            space calculated on the basis of floor space index or floor area ratio allowable for
            that plot, for utilization by the owner himself or by way of transfer by him to someone
            else from the present location to a specified area in the plan.
          </p>
        </div>
      </ContentSection>

      <ContentSection id="about-tdr" title="About TDR" muted>
        <p className="mx-auto max-w-3xl text-center text-lg leading-relaxed text-slate-600">
          Transferable development rights (TDR) is a method by which developers can purchase the
          development rights of certain parcels within a designated &quot;sending district&quot; and
          transfer the rights to another &quot;receiving district&quot; to increase the density of
          their new development. It is used for controlling land use to complement land-use planning
          and zoning for more effective urban growth management and land conservation.
        </p>
      </ContentSection>
    </PublicPageLayout>
  );
}
