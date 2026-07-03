'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Shield, Eye, EyeOff, Mail, Lock } from 'lucide-react';

const SSO_ENABLED = process.env.NEXT_PUBLIC_OFFICIAL_SSO_ENABLED === 'true';

export default function OfficialLoginClient() {
  const router = useRouter();
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
        body: JSON.stringify({ email, password }),
      });

      const data = (await res.json()) as {
        success: boolean;
        data?: { redirectTo: string };
        error?: string;
      };

      if (!res.ok || !data.success) {
        throw new Error(data.error ?? 'Login failed');
      }

      router.push(data.data?.redirectTo ?? '/official/dashboard');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-lg mx-auto animate-slide-up">
      <div className="text-center mb-6">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary text-white mb-4 shadow-lg shadow-indigo-900/25">
          <Shield className="h-7 w-7 text-apcrda-secondary" />
        </div>
        <h1 className="text-2xl font-bold text-apcrda-primary">Official Login</h1>
        <p className="text-sm text-slate-500 mt-1">Sign in with your APCRDA email and password</p>
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
                  className="input-field input-field-with-icon"
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
                  className="input-field input-field-with-icon pr-11"
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
                className="flex items-center justify-center gap-2 w-full border-2 border-apcrda-primary text-apcrda-primary py-3 rounded-xl font-semibold hover:bg-apcrda-primary/5 transition-colors"
              >
                <Shield className="h-4 w-4" />
                Login with NIC SSO
              </Link>
            </>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-slate-500">
        Farmer?{' '}
        <Link href="/farmer-login" className="font-semibold text-apcrda-accent hover:underline">
          Login here
        </Link>
      </p>
    </div>
  );
}
