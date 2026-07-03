'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Wheat } from 'lucide-react';

export default function FarmerLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reason = searchParams.get('reason');
  const urlError = searchParams.get('error');

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      router.push('/farmer/dashboard');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto animate-slide-up">
      <div className="text-center mb-6">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-teal text-white mb-4 shadow-lg shadow-teal-900/25">
          <Wheat className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-apcrda-primary">Farmer Login</h1>
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
                  className="input-field input-field-accent"
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
                  className="input-field input-field-accent text-center font-mono text-xl tracking-[0.3em]"
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
                className="w-full text-sm text-slate-500 hover:text-apcrda-primary py-1"
              >
                ← Change phone number
              </button>
            </div>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Official?{' '}
        <Link href="/official-login" className="font-semibold text-apcrda-primary hover:underline">
          Login here
        </Link>
      </p>
    </div>
  );
}
