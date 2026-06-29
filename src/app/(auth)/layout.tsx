import { PublicPageLayout } from '@/components/layout/PublicPageLayout';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicPageLayout showLogins={false}>
      <div className="bg-gradient-to-b from-indigo-50/80 via-purple-50/30 to-white px-4 py-10 md:py-14">
        {children}
      </div>
    </PublicPageLayout>
  );
}
