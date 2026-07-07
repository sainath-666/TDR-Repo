import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { HeroCarousel } from '@/components/home/HeroCarousel';
import { LandingQuickActions } from '@/components/home/LandingQuickActions';
import { HomePageSections } from '@/components/home/HomePageSections';

export default function HomePage() {
  return (
    <PublicPageLayout>
      <HeroCarousel />
      <LandingQuickActions />
      <HomePageSections />
    </PublicPageLayout>
  );
}
