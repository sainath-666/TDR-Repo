import Link from 'next/link';
import {
  FileEdit,
  ClipboardCheck,
  Smartphone,
  Shield,
  Scale,
  ArrowRight,
  CheckCircle2,
  FileText,
  Search,
  Users,
} from 'lucide-react';
import { PublicPageLayout } from '@/components/layout/PublicPageLayout';
import { Badge } from '@/components/ui/Badge';
import { getPortalStats, getRecentPublicBonds } from '@/lib/portal-stats';

const SERVICES = [
  {
    href: '/official-login',
    title: 'Bond Data Entry',
    description: 'DEO & Surveyor 3-phase offline bond registration',
    icon: FileEdit,
    cta: 'DEO Login',
    color: 'border-l-blue-600',
    iconBg: 'bg-blue-50 text-blue-700',
  },
  {
    href: '/official-login',
    title: 'Approval Workflow',
    description: '5-level chain: Tahsildar → SDC → Director → Commissioner',
    icon: ClipboardCheck,
    cta: 'Official Login',
    color: 'border-l-amber-500',
    iconBg: 'bg-amber-50 text-amber-700',
  },
  {
    href: '/farmer-login',
    title: 'Farmer Services',
    description: 'Track bond status, download TDR certificates via OTP',
    icon: Smartphone,
    cta: 'Farmer Login',
    color: 'border-l-emerald-600',
    iconBg: 'bg-emerald-50 text-emerald-700',
  },
  {
    href: '/verify',
    title: 'Certificate Verification',
    description: 'Public verification of TDR bond authenticity',
    icon: Search,
    cta: 'Verify Now',
    color: 'border-l-purple-600',
    iconBg: 'bg-purple-50 text-purple-700',
  },
] as const;

const STEPS = [
  { step: '01', title: 'Data Entry', desc: 'DEO registers bond with holder & land details' },
  { step: '02', title: 'Document Upload', desc: 'Ownership deed, Aadhaar, sketch & certificates' },
  { step: '03', title: '5-Level Approval', desc: 'Sequential review by revenue officials' },
  { step: '04', title: 'Certificate', desc: 'Digital TDR certificate issued to farmer' },
] as const;

export default async function HomePage() {
  const [stats, recentBonds] = await Promise.all([getPortalStats(), getRecentPublicBonds(6)]);

  const heroStats = [
    { label: 'Total Bonds', value: String(stats.totalBonds) },
    { label: 'Active Certificates', value: String(stats.activeBonds) },
    { label: 'In Approval', value: String(stats.pendingBonds) },
    { label: 'Registered Farmers', value: String(stats.registeredFarmers) },
  ];

  return (
    <PublicPageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden gradient-primary text-white">
        <div className="absolute inset-0 opacity-[0.07]">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-apcrda-secondary/20 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-24">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-apcrda-secondary font-medium ring-1 ring-white/20 mb-6">
              <Shield className="h-4 w-4" />
              Government of Andhra Pradesh · Official Portal
            </p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight text-balance">
              Transferable Development Rights
              <span className="block text-apcrda-secondary mt-1">Bond Migration Platform</span>
            </h1>
            <p className="mt-5 text-base md:text-lg text-slate-300 leading-relaxed max-w-2xl">
              Validate offline TDR bonds through a secure online portal for the Capital City land
              pooling scheme. Built for officials, data entry operators, and farmers.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/official-login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-apcrda-secondary text-apcrda-primary-dark font-bold text-sm hover:bg-apcrda-secondary-light transition-colors shadow-lg"
              >
                Official Login
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/farmer-login"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-white/10 text-white font-semibold text-sm ring-1 ring-white/30 hover:bg-white/20 transition-colors"
              >
                Farmer Login
              </Link>
            </div>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
            {heroStats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl bg-white/10 backdrop-blur-sm ring-1 ring-white/20 px-4 py-4 text-center"
              >
                <p className="text-2xl md:text-3xl font-bold text-apcrda-secondary">{stat.value}</p>
                <p className="text-xs text-slate-300 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-apcrda-primary">Citizen Services</h2>
          <p className="mt-2 text-slate-500 max-w-xl mx-auto">
            Access government TDR services through dedicated portals
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((service) => {
            const Icon = service.icon;
            return (
              <Link
                key={service.title}
                href={service.href}
                className={`group bg-white rounded-xl border border-slate-200 border-l-4 ${service.color} p-5 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5`}
              >
                <div
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${service.iconBg} mb-4`}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <h3 className="font-bold text-apcrda-primary group-hover:text-apcrda-primary-light">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm text-slate-500 leading-relaxed">{service.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-apcrda-primary">
                  {service.cta}
                  <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Recent bonds from database */}
      {recentBonds.length > 0 && (
        <section className="bg-white border-y border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-16">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-apcrda-primary">
                  Recent Bond Activity
                </h2>
                <p className="text-sm text-slate-500 mt-1">Live data from the TDR registry</p>
              </div>
              <Link
                href="/verify"
                className="text-sm font-semibold text-apcrda-primary hover:underline hidden sm:inline"
              >
                Verify certificate →
              </Link>
            </div>
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-card">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-semibold">TDR Number</th>
                    <th className="px-4 py-3 font-semibold">Holder</th>
                    <th className="px-4 py-3 font-semibold">Village</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentBonds.map((bond) => (
                    <tr key={bond.tdrNumber} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <Link
                          href={`/verify/${bond.tdrNumber}`}
                          className="font-semibold text-apcrda-primary hover:underline"
                        >
                          {bond.tdrNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{bond.holderName ?? '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{bond.village ?? '—'}</td>
                      <td className="px-4 py-3">
                        <Badge status={bond.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section id="about" className="bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-apcrda-primary">How It Works</h2>
            <p className="mt-2 text-slate-500">End-to-end TDR bond lifecycle</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((item) => (
              <div key={item.step} className="relative text-center p-6">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-apcrda-primary text-apcrda-secondary font-bold text-lg mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold text-apcrda-primary">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-2xl bg-apcrda-primary/5 border border-apcrda-primary/10 p-6 md:p-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-apcrda-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-apcrda-primary">Cerbos Authorization</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  Every action policy-checked & audited
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Scale className="h-5 w-5 text-apcrda-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-apcrda-primary">Blockchain Audit</p>
                <p className="text-sm text-slate-500 mt-0.5">Immutable Hyperledger Fabric ledger</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-apcrda-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-apcrda-primary">5-Level Approval</p>
                <p className="text-sm text-slate-500 mt-0.5">
                  L1 Tahsildar through L4 Commissioner
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16">
        <div className="rounded-2xl gradient-primary p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 text-white">
          <div className="flex items-center gap-4">
            <FileText className="h-12 w-12 text-apcrda-secondary shrink-0" />
            <div>
              <h3 className="text-xl font-bold">Ready to access your portal?</h3>
              <p className="text-slate-300 text-sm mt-1">
                Officials and farmers — sign in with your registered credentials
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <Link
              href="/official-login"
              className="px-5 py-2.5 rounded-lg bg-apcrda-secondary text-apcrda-primary-dark font-bold text-sm hover:bg-apcrda-secondary-light transition-colors"
            >
              Official Login
            </Link>
            <Link
              href="/farmer-login"
              className="px-5 py-2.5 rounded-lg bg-white/10 ring-1 ring-white/30 font-semibold text-sm hover:bg-white/20 transition-colors"
            >
              Farmer Login
            </Link>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
}
