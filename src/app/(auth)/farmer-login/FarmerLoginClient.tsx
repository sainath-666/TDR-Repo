'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ChevronRight, Wheat } from 'lucide-react';
import {
  DEMO_FARMER_LABEL,
  DEMO_FARMER_OTP_HINT,
  DEMO_FARMER_PHONE,
  isFarmerDemoLoginVisible,
} from '@/lib/dev-auth';

const SHOW_DEMO_LOGIN = isFarmerDemoLoginVisible();

export default function FarmerLoginClient() {
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reason = searchParams.get('reason');
  const urlError = searchParams.get('error');

  function applyDemoCredentials() {
    setPhone(DEMO_FARMER_PHONE);
    setOtp(DEMO_FARMER_OTP_HINT);
    setError('');
  }

  async function requestOtp() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setStep('otp');
      if (phone === DEMO_FARMER_PHONE) {
        setOtp(DEMO_FARMER_OTP_HINT);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ phone, otp }),
      });
      let data: { success: boolean; error?: string };
      try {
        data = (await res.json()) as typeof data;
      } catch {
        throw new Error('Login service returned an invalid response. Please try again.');
      }
      if (!res.ok || !data.success) throw new Error(data.error ?? 'Invalid OTP');
      window.location.assign('/farmer/dashboard');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid OTP');
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto animate-slide-up">
      <div className="text-center mb-6">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-portal text-white mb-4 shadow-lg shadow-rose-900/25">
          <Wheat className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-apcrda-portal-maroon">Citizen Login</h1>
        <p className="text-sm text-slate-500 mt-1">Track TDR bonds &amp; download certificates</p>
      </div>

      <div className="auth-card">
        <div className="auth-card-accent" />

        <div className="p-6 md:p-8">
          {reason === 'idle' && (
            <p className="alert-banner-warning">Session expired. Please login again.</p>
          )}

          {(error || urlError) && (
            <p className="alert-banner-error">{error || decodeURIComponent(urlError!)}</p>
          )}

          {step === 'phone' ? (
            <div className="space-y-4">
              <div>
                <label className="field-label">Aadhaar-linked Mobile Number</label>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="input-field input-field-portal"
                  placeholder="10-digit mobile number"
                />
              </div>
              <button
                onClick={requestOtp}
                disabled={phone.length !== 10 || loading}
                className="btn-submit btn-submit-accent"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="field-label">OTP sent to +91 {phone}</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="input-field input-field-portal text-center font-mono text-xl tracking-[0.3em]"
                  placeholder="000000"
                />
              </div>
              <button
                onClick={verifyOtp}
                disabled={otp.length !== 6 || loading}
                className="btn-submit btn-submit-primary"
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
              <button
                onClick={() => setStep('phone')}
                className="w-full text-sm text-slate-500 hover:text-apcrda-portal-maroon py-1"
              >
                ← Change phone number
              </button>
            </div>
          )}
        </div>
      </div>

      {SHOW_DEMO_LOGIN && (
        <div className="mt-5 mb-5 rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Demo login
          </p>
          <button
            type="button"
            onClick={() => {
              applyDemoCredentials();
              setStep('phone');
            }}
            className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-left transition-colors hover:border-apcrda-portal-maroon/30 hover:bg-rose-50/50"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-apcrda-portal-maroon text-[11px] font-bold text-white">
              C
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold text-slate-800">
                {DEMO_FARMER_LABEL}
              </span>
              <span className="block truncate text-[10px] text-slate-500">
                Mobile: {DEMO_FARMER_PHONE} · OTP: {DEMO_FARMER_OTP_HINT}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
          </button>
          <p className="mt-3 text-[10px] text-slate-400">
            Tap to fill mobile. After Send OTP, use{' '}
            <span className="font-mono">{DEMO_FARMER_OTP_HINT}</span> (or any 6-digit code).
          </p>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        Official?{' '}
        <Link
          href="/official-login"
          className="font-semibold text-apcrda-portal-maroon hover:underline"
        >
          Login here
        </Link>
      </p>
    </div>
  );
}
