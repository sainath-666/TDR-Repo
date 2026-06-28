'use client';

import { useState } from 'react';

export default function CertificateDownloadPage({ params }: { params: { id: string } }) {
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'initial' | 'otp' | 'done'>('initial');
  const [loading, setLoading] = useState(false);

  async function requestOtp() {
    setLoading(true);
    await fetch('/api/auth/otp/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: '' }),
    });
    setStep('otp');
    setLoading(false);
  }

  async function download() {
    setLoading(true);
    const res = await fetch(`/api/certificates/${params.id}/download`);
    const data = await res.json();
    if (data.success) setStep('done');
    setLoading(false);
  }

  return (
    <main className="min-h-screen p-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-apcrda-primary mb-4">Download Certificate</h1>
      {step === 'initial' && (
        <button
          onClick={requestOtp}
          disabled={loading}
          className="w-full bg-apcrda-primary text-white py-3 rounded-lg"
        >
          Send OTP to Download
        </button>
      )}
      {step === 'otp' && (
        <div className="space-y-4">
          <input
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            maxLength={6}
            className="w-full border rounded p-2 text-center text-xl"
            placeholder="000000"
          />
          <button
            onClick={download}
            disabled={loading}
            className="w-full bg-apcrda-accent text-white py-3 rounded-lg"
          >
            Download PDF
          </button>
        </div>
      )}
      {step === 'done' && (
        <p className="text-green-700 bg-green-50 p-4 rounded">Certificate ready for download.</p>
      )}
    </main>
  );
}
