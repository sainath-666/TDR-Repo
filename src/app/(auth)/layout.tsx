import { PublicPageLayout } from '@/components/layout/PublicPageLayout';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicPageLayout>
      <div className="bg-gradient-to-b from-rose-50/80 via-rose-50/30 to-white px-4 py-10 md:py-14">
        {children}
      </div>
    </PublicPageLayout>
  );
}
