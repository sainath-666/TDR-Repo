import Link from 'next/link';

const DEV_ROLES = [
  { employeeId: 'DEO001', label: 'DEO (Data Entry)', hint: '→ DEO Dashboard' },
  { employeeId: 'TAH001', label: 'Dy. Tahsildar (L1)', hint: '→ Approval Queue' },
  { employeeId: 'SDC001', label: 'SDC (L2)', hint: '→ Approval Queue' },
  { employeeId: 'DIR001', label: 'Director Lands (L3)', hint: '→ Approval Queue' },
  { employeeId: 'COM001', label: 'Commissioner (L4)', hint: '→ Approval Queue' },
];

const SSO_ENABLED = process.env.NEXT_PUBLIC_OFFICIAL_SSO_ENABLED === 'true';

export default function OfficialLoginPage({ searchParams }: { searchParams: { error?: string } }) {
  const error = searchParams.error ? decodeURIComponent(searchParams.error) : null;

  return (
    <main className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-bold text-apcrda-primary text-center">Official Login</h1>
        <p className="text-sm text-slate-500 text-center mt-1">
          APCRDA TDR Bond Migration Platform
        </p>

        {error && <p className="mt-4 text-sm text-red-600 bg-red-50 p-3 rounded">{error}</p>}

        <div className="mt-6">
          <p className="text-sm font-medium text-apcrda-primary mb-1">Sign in as test official</p>
          <p className="text-xs text-slate-500 mb-3">
            Local development — pick a role from seeded test data
          </p>
          <div className="space-y-2">
            {DEV_ROLES.map((role) => (
              <form key={role.employeeId} action="/api/auth/official/dev-login" method="POST">
                <input type="hidden" name="employeeId" value={role.employeeId} />
                <button
                  type="submit"
                  className="w-full flex justify-between items-center border border-apcrda-primary/20 bg-apcrda-primary/5 py-3 px-4 rounded-lg text-sm hover:bg-apcrda-primary/10 cursor-pointer"
                >
                  <span className="font-medium">{role.label}</span>
                  <span className="text-xs text-slate-400">{role.hint}</span>
                </button>
              </form>
            ))}
          </div>
        </div>

        {SSO_ENABLED ? (
          <Link
            href="/api/auth/official/sso"
            className="mt-8 block w-full border border-slate-200 text-apcrda-primary py-3 rounded-lg font-medium text-center hover:bg-slate-50"
          >
            Login with NIC SSO
          </Link>
        ) : (
          <p className="mt-8 text-xs text-slate-400 text-center border-t pt-4">
            NIC SSO is disabled locally. Set{' '}
            <code className="bg-slate-100 px-1 rounded">NEXT_PUBLIC_OFFICIAL_SSO_ENABLED=true</code>{' '}
            after enabling Google/OIDC in Supabase.
          </p>
        )}

        <p className="mt-4 text-xs text-slate-400 text-center">
          DEO · Surveyor · Tahsildar · SDC · Director · Commissioner
        </p>
      </div>
    </main>
  );
}
