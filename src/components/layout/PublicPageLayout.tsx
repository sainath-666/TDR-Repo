import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';
import { ScrollToTop } from '@/components/home/ScrollToTop';

interface PublicPageLayoutProps {
  children: React.ReactNode;
  showLogins?: boolean;
}

export function PublicPageLayout({ children, showLogins = true }: PublicPageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
      <ScrollToTop />
    </div>
  );
}
