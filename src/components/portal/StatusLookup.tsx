'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useLocale } from '@/lib/i18n/locale-context';

function generateCaptcha(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export function StatusLookup() {
  const router = useRouter();
  const { t } = useLocale();
  const [certificateNo, setCertificateNo] = useState('');
  const [captcha, setCaptcha] = useState(generateCaptcha);
  const [captchaInput, setCaptchaInput] = useState('');
  const [error, setError] = useState('');

  function refreshCaptcha() {
    setCaptcha(generateCaptcha());
    setCaptchaInput('');
    setError('');
  }

  function validateAndGo() {
    if (!certificateNo.trim()) {
      setError(t.statusPage.errorNoCert);
      return;
    }
    if (captchaInput.toUpperCase() !== captcha) {
      setError(t.statusPage.errorCaptcha);
      refreshCaptcha();
      return;
    }
    setError('');
    router.push(`/status/${encodeURIComponent(certificateNo.trim())}`);
  }

  return (
    <div className="mx-auto max-w-xl">
      <Card>
        <div className="space-y-5">
          <div>
            <label htmlFor="cert-no" className="mb-1.5 block text-sm font-medium text-slate-700">
              {t.statusPage.enterCertNo}
              <span className="text-red-600">*</span>
            </label>
            <div className="flex gap-2">
              <input
                id="cert-no"
                type="text"
                value={certificateNo}
                onChange={(e) => setCertificateNo(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-[var(--portal-purple)] focus:outline-none focus:ring-1 focus:ring-[var(--portal-purple)]"
                placeholder={t.statusPage.certPlaceholder}
              />
              <Button
                type="button"
                onClick={validateAndGo}
                className="shrink-0 bg-teal-600 hover:bg-teal-700"
              >
                {t.statusPage.verify}
              </Button>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="rounded border border-slate-300 bg-slate-50 px-4 py-2 font-mono text-lg font-bold italic tracking-widest text-[var(--portal-blue)]">
                {captcha}
              </div>
              <button
                type="button"
                onClick={refreshCaptcha}
                className="rounded-full p-2 text-slate-600 hover:bg-slate-100"
                aria-label={t.statusPage.refreshCaptcha}
              >
                <RefreshCw className="h-5 w-5" />
              </button>
            </div>
            <label htmlFor="captcha" className="mb-1.5 block text-sm font-medium text-slate-700">
              {t.statusPage.enterCaptcha}
              <span className="text-red-600">*</span>
            </label>
            <div className="flex gap-2">
              <input
                id="captcha"
                type="text"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm uppercase focus:border-[var(--portal-purple)] focus:outline-none focus:ring-1 focus:ring-[var(--portal-purple)]"
                placeholder={t.statusPage.captchaPlaceholder}
              />
              <Button
                type="button"
                onClick={validateAndGo}
                className="shrink-0 bg-teal-600 hover:bg-teal-700"
              >
                {t.statusPage.checkStatus}
              </Button>
            </div>
          </div>

          {error && <p className="text-sm font-medium text-red-600">{error}</p>}
        </div>
      </Card>

      <p className="mt-4 text-center text-sm text-slate-500">{t.statusPage.resultsHint}</p>
    </div>
  );
}
