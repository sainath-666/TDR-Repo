'use client';

export default function OfficialLoginPage() {
  async function handleSSO() {
    const res = await fetch('/api/auth/official/sso', { method: 'POST' });
    const data = await res.json();
    if (data.data?.url) {
      window.location.href = data.data.url;
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-apcrda-primary">Official Login</h1>
        <p className="text-sm text-slate-500 mt-1">APCRDA TDR Bond Migration Platform</p>
        <button
          onClick={handleSSO}
          className="mt-8 w-full bg-apcrda-primary text-white py-3 rounded-lg font-medium"
        >
          Login with NIC SSO
        </button>
        <p className="mt-4 text-xs text-slate-400">
          For DEO, Surveyor, Tahsildar, SDC, Director, and Commissioner roles
        </p>
      </div>
    </main>
  );
}
