'use client';

import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { useLocale } from '@/lib/i18n/locale-context';

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const { t } = useLocale();

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 400);
    }
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      className="fixed bottom-6 right-6 z-40 p-2.5 bg-slate-400/90 hover:bg-slate-500 text-white rounded shadow-lg transition-colors"
      aria-label={t.scrollToTop}
    >
      <ChevronUp className="h-5 w-5" />
    </button>
  );
}
