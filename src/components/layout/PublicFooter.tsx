import Link from 'next/link';
import { MapPin, Phone, Clock } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer id="contact" className="gov-footer mt-auto">
      <div className="max-w-[1140px] mx-auto px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-3 text-sm">
          <div>
            <h3 className="font-bold text-base mb-3">Get In Touch</h3>
            <p className="text-white/90 leading-relaxed">
              Your call will be answered 24 hours a day, 7 days a week.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-base mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Working Hours
            </h3>
            <ul className="text-white/90 space-y-1">
              <li>Mon-Friday: 10:30 am to 5:00 pm</li>
              <li>
                Second-Saturday: <strong>Closed</strong>
              </li>
              <li>
                Sunday: <strong>Closed</strong>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold text-base mb-3">Contact Us</h3>
            <p className="font-semibold mb-2">
              Andhra Pradesh Capital Region Development Authority
            </p>
            <p className="flex items-start gap-2 text-white/90 mb-2 leading-relaxed">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
              2nd, 3rd, and 5th Floors, APCRDA Project Office, Rayapudi Post, Tulluru Mandal,
              Amravati, Guntur District, Andhra Pradesh - 522237.
            </p>
            <p className="flex items-center gap-2 text-white/90">
              <Phone className="h-4 w-4 shrink-0" />
              Phone :{' '}
              <a href="tel:08662527110" className="hover:underline">
                0866 – 2527110
              </a>
            </p>
          </div>
        </div>

        <div className="mt-8 pt-5 border-t border-white/20 flex flex-col sm:flex-row justify-between gap-2 text-xs text-white/60">
          <p>© {new Date().getFullYear()} APCRDA. All rights reserved.</p>
          <p>
            <Link href="/official-login" className="hover:text-white">
              Officer Login
            </Link>
            {' · '}
            <Link href="/farmer-login" className="hover:text-white">
              Citizen Login
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
