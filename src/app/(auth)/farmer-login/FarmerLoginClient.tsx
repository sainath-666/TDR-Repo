'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function FarmerLoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const reason = searchParams.get('reason');

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
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-apcrda-primary text-center">Farmer Login</h1>
        <p className="text-sm text-slate-500 text-center mt-1">APCRDA TDR Certificate Portal</p>

        {reason === 'idle' && (
          <p className="mt-4 text-sm text-amber-700 bg-amber-50 p-3 rounded">
            Session expired due to inactivity. Please login again.
          </p>
        )}

        {error && <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

        {step === 'phone' ? (
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Aadhaar-linked Mobile</label>
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="10-digit mobile number"
              />
            </div>
            <button
              onClick={requestOtp}
              disabled={phone.length !== 10 || loading}
              className="w-full bg-apcrda-primary text-white py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Enter OTP</label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full border rounded-lg px-3 py-2 text-center text-xl tracking-widest"
                placeholder="000000"
              />
            </div>
            <button
              onClick={verifyOtp}
              disabled={otp.length !== 6 || loading}
              className="w-full bg-apcrda-accent text-white py-2 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>
            <button onClick={() => setStep('phone')} className="w-full text-sm text-slate-500">
              Change phone number
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
