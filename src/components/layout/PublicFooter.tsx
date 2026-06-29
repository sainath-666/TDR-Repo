import Link from 'next/link';
import { Landmark, Mail, MapPin, Phone } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer id="contact" className="bg-apcrda-primary-dark text-white mt-auto">
      <div className="h-1 gradient-gold" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 md:py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                <Landmark className="h-5 w-5 text-apcrda-secondary" />
              </div>
              <div>
                <p className="font-bold text-lg">APCRDA</p>
                <p className="text-xs text-slate-400">TDR Bond Migration Platform</p>
              </div>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-md">
              Official portal for Transferable Development Rights bond validation under the Capital
              City land pooling scheme. G.O. 207 MA&amp;UD dt. 08.08.2016.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-apcrda-secondary uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link href="/official-login" className="hover:text-white transition-colors">
                  Official Login
                </Link>
              </li>
              <li>
                <Link href="/farmer-login" className="hover:text-white transition-colors">
                  Farmer Login
                </Link>
              </li>
              <li>
                <Link href="/verify" className="hover:text-white transition-colors">
                  Verify Certificate
                </Link>
              </li>
              <li>
                <Link href="/#services" className="hover:text-white transition-colors">
                  Services
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-apcrda-secondary uppercase tracking-wider mb-4">
              Contact
            </h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-apcrda-secondary" />
                Amaravati, Andhra Pradesh
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-apcrda-secondary" />
                0866-XXX-XXXX
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0 text-apcrda-secondary" />
                tdr@apcrda.ap.gov.in
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} APCRDA. All rights reserved.</p>
          <p>LPS Rule 5(4)(B) · Area unit: Square Yards · 5-level approval chain</p>
        </div>
      </div>
    </footer>
  );
}
