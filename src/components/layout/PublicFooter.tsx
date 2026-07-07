'use client';

import Link from 'next/link';
import { MapPin, Phone, Clock } from 'lucide-react';
import { useLocale } from '@/lib/i18n/locale-context';

export function PublicFooter() {
  const { t } = useLocale();

  return (
    <footer id="contact" className="gov-footer mt-auto">
      <div className="max-w-[1140px] mx-auto px-6 py-10">
        <div className="grid gap-8 text-sm sm:grid-cols-3">
          <div>
            <h3 className="mb-3 text-base font-bold tracking-tight text-white">
              {t.footer.getInTouch}
            </h3>
            <p className="text-white/90 leading-relaxed">{t.footer.callAvailability}</p>
          </div>

          <div>
            <h3 className="font-bold text-base mb-3 flex items-center gap-2 text-white">
              <Clock className="h-4 w-4" />
              {t.footer.workingHours}
            </h3>
            <ul className="text-white/90 space-y-1">
              <li>{t.footer.monFri}</li>
              <li>
                {t.footer.secondSaturday} <strong>{t.footer.closed}</strong>
              </li>
              <li>
                {t.footer.sunday} <strong>{t.footer.closed}</strong>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-base mb-3 text-white">{t.footer.contactUs}</h3>
            <p className="font-semibold mb-2 text-white">{t.footer.orgName}</p>
            <p className="flex items-start gap-2 text-white/90 mb-2 leading-relaxed">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              {t.footer.address}
            </p>
            <p className="flex items-center gap-2 text-white/90">
              <Phone className="h-4 w-4 shrink-0" />
              {t.footer.phone}{' '}
              <a href="tel:08662527110" className="hover:underline">
                0866 – 2527110
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-white/20 flex flex-col sm:flex-row justify-between gap-2 text-xs text-white/60">
          <p>
            © {new Date().getFullYear()} {t.footer.copyright}
          </p>
          <p>
            <Link href="/official-login" className="hover:text-white">
              {t.footer.officerLogin}
            </Link>
            {' · '}
            <Link href="/farmer-login" className="hover:text-white">
              {t.footer.citizenLogin}
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
