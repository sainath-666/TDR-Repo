import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';
import { ScrollToTop } from '@/components/home/ScrollToTop';
import { LocaleProvider } from '@/lib/i18n/locale-context';

interface PublicPageLayoutProps {
  children: React.ReactNode;
  showLogins?: boolean;
}

export function PublicPageLayout({ children, showLogins = true }: PublicPageLayoutProps) {
  return (
    <LocaleProvider>
      <div className="flex min-h-screen flex-col bg-white">
        <PublicHeader showLogins={showLogins} />
        <main className="flex-1">{children}</main>
        <PublicFooter />
        <ScrollToTop />
      </div>
    </LocaleProvider>
  );
}
