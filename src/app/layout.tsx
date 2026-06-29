import type { Metadata } from 'next';
import { Inter, Noto_Sans_Telugu } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const notoTelugu = Noto_Sans_Telugu({
  subsets: ['telugu'],
  weight: ['400', '600', '700'],
  variable: '--font-telugu',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'APCRDA TDR Bond Migration Platform',
  description: 'Offline TDR Bond Validation — Capital City',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/images/APGOV-logo.png', type: 'image/png' }],
    apple: [{ url: '/images/APGOV-logo.png', type: 'image/png' }],
    shortcut: ['/images/APGOV-logo.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${notoTelugu.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
