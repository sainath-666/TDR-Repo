import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-apcrda-primary">
            APCRDA TDR Bond Migration Platform
          </h1>
          <p className="mt-2 text-slate-600">
            Offline TDR Validation in Online Portal — Capital City
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Link
            href="/deo/dashboard"
            className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-apcrda-primary">DEO Portal</h2>
            <p className="mt-1 text-sm text-slate-500">3-phase bond data entry</p>
          </Link>
          <Link
            href="/official/queue"
            className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-apcrda-primary">Official Portal</h2>
            <p className="mt-1 text-sm text-slate-500">5-level approval chain</p>
          </Link>
          <Link
            href="/farmer-login"
            className="rounded-lg border bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <h2 className="font-semibold text-apcrda-primary">Farmer PWA</h2>
            <p className="mt-1 text-sm text-slate-500">OTP login &amp; certificates</p>
          </Link>
        </div>

        <p className="text-xs text-slate-400">
          G.O. 207 MA&amp;UD dt. 08.08.2016 · LPS Rule 5(4)(B)
        </p>
      </div>
    </main>
  );
}
