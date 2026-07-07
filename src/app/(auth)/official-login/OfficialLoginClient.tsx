'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Shield, Eye, EyeOff, Mail, Lock, ChevronRight } from 'lucide-react';
import {
  getApprovalLoginAccounts,
  isApprovalDevLoginsVisible,
  DEV_LOGIN_PASSWORD_HINT,
} from '@/lib/approval-logins';

const SSO_ENABLED = process.env.NEXT_PUBLIC_OFFICIAL_SSO_ENABLED === 'true';
const SHOW_DEV_LOGINS = isApprovalDevLoginsVisible();
const APPROVAL_LOGINS = getApprovalLoginAccounts();

export default function OfficialLoginClient() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const urlError = searchParams.get('error');
  const reason = searchParams.get('reason');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/official/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({ email, password }),
      });

      let data: {
        success: boolean;
        data?: { redirectTo: string };
        error?: string;
      };
      try {
        data = (await res.json()) as typeof data;
      } catch {
        throw new Error('Login service returned an invalid response. Please try again.');
      }

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? 'Invalid email or password');
      }

      // Full navigation so middleware sees session cookies on the next request.
      window.location.assign(data.data?.redirectTo ?? '/official/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto animate-slide-up">
      <div className="text-center mb-6">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-portal text-white mb-4 shadow-lg shadow-rose-900/25">
          <Shield className="h-7 w-7 text-apcrda-secondary" />
        </div>
        <h1 className="text-2xl font-bold text-apcrda-portal-maroon">Official Login</h1>
        <p className="text-sm text-slate-500 mt-1">
          Five approval roles · DEO through Commissioner
        </p>
      </div>

      <div className="auth-card">
        <div className="auth-card-accent" />

        <div className="p-6 md:p-8">
          {reason === 'idle' && (
            <p className="alert-banner-warning">
              Session expired due to inactivity. Please sign in again.
            </p>
          )}

          {reason === 'unauthorized' && (
            <p className="alert-banner-warning">
              You do not have access to that portal. Sign in with an official account.
            </p>
          )}

          {(error || urlError) && (
            <p className="alert-banner-error">{error || decodeURIComponent(urlError!)}</p>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="field-label">
                Email / Username
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field input-field-portal input-field-with-icon"
                  placeholder="official@apcrda.ap.gov.in"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="field-label">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field input-field-portal input-field-with-icon pr-11"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || password.length < 8}
              className="btn-submit btn-submit-primary"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {SSO_ENABLED && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-3 text-slate-400">or</span>
                </div>
              </div>
              <Link
                href="/api/auth/official/sso"
                className="flex items-center justify-center gap-2 w-full border-2 border-apcrda-portal-maroon text-apcrda-portal-maroon py-3 rounded-xl font-semibold hover:bg-apcrda-portal-maroon/5 transition-colors"
              >
                <Shield className="h-4 w-4" />
                Login with NIC SSO
              </Link>
            </>
          )}
        </div>
      </div>

      {SHOW_DEV_LOGINS && (
        <div className="mb-5 rounded-2xl border border-rose-100 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Approval logins (dev)
          </p>
          <ol className="space-y-2">
            {APPROVAL_LOGINS.map((account) => (
              <li key={account.employeeId}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(account.email);
                    setPassword(DEV_LOGIN_PASSWORD_HINT);
                    setError('');
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5 text-left transition-colors hover:border-apcrda-portal-maroon/30 hover:bg-rose-50/50"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-apcrda-portal-maroon text-[11px] font-bold text-white">
                    {account.level}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-slate-800">
                      {account.label}
                    </span>
                    <span className="block truncate text-[10px] text-slate-500">
                      {account.email}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                </button>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-[10px] text-slate-400">
            Password: <span className="font-mono">{DEV_LOGIN_PASSWORD_HINT}</span> · Run{' '}
            <span className="font-mono">npm run auth:sync</span> after seed
          </p>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-slate-500">
        Farmer?{' '}
        <Link
          href="/farmer-login"
          className="font-semibold text-apcrda-portal-maroon hover:underline"
        >
          Login here
        </Link>
      </p>
    </div>
  );
}
