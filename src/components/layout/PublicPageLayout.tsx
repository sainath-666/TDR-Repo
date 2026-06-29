import { PublicFooter } from './PublicFooter';
import { PublicHeader } from './PublicHeader';

interface PublicPageLayoutProps {
  children: React.ReactNode;
  showLogins?: boolean;
}

export function PublicPageLayout({ children, showLogins = true }: PublicPageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <PublicHeader showLogins={showLogins} />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
