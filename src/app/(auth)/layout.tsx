import { PublicPageLayout } from '@/components/layout/PublicPageLayout';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicPageLayout showLogins={false}>
      <div className="py-8 md:py-12 px-4">{children}</div>
    </PublicPageLayout>
  );
}
