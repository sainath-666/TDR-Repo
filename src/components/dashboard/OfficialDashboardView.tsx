import Link from 'next/link';
import { BondStatus } from '@prisma/client';
import { FileText, Clock, CheckCircle2, XCircle, ArrowRight, ClipboardList } from 'lucide-react';
import type { OfficialDashboardData } from '@/lib/queries/official-dashboard';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';

interface OfficialDashboardViewProps {
  data: OfficialDashboardData;
  portal: 'deo' | 'official';
  roleLabel: string;
}

function LevelStatCard({ block }: { block: OfficialDashboardData['levelStats'][number] }) {
  return (
    <Card className="h-full border-l-4 border-l-apcrda-primary">
      <p className="text-sm font-bold text-apcrda-primary mb-4">{block.title}</p>
      {block.level === 1 ? (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-slate-500">Drafts</dt>
            <dd className="text-2xl font-bold text-slate-900 tabular-nums">{block.drafts ?? 0}</dd>
          </div>
          <div>
            <dt className="text-slate-500">In pipeline</dt>
            <dd className="text-2xl font-bold text-slate-900 tabular-nums">
              {block.inPipeline ?? 0}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Active</dt>
            <dd className="text-2xl font-bold text-emerald-700 tabular-nums">
              {block.active ?? 0}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Rejected</dt>
            <dd className="text-2xl font-bold text-red-600 tabular-nums">{block.rejected ?? 0}</dd>
          </div>
        </dl>
      ) : (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div>
            <dt className="text-slate-500">In queue</dt>
            <dd className="text-2xl font-bold text-amber-700 tabular-nums">{block.inQueue ?? 0}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Forwarded</dt>
            <dd className="text-2xl font-bold text-slate-900 tabular-nums">
              {block.forwarded ?? 0}
            </dd>
          </div>
        </dl>
      )}
    </Card>
  );
}

export function OfficialDashboardView({ data, portal, roleLabel }: OfficialDashboardViewProps) {
  const isDeo = portal === 'deo';
  const queueHref = isDeo ? undefined : '/official/queue';
  const newBondHref = isDeo ? '/deo/bonds/new' : undefined;
  const resumeHref = (bondId: string) =>
    isDeo ? `/deo/bonds/new?bondId=${bondId}` : `/official/bonds/${bondId}/review`;

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Dashboard"
        description={`${roleLabel} — cumulative approval pipeline (${data.scopeLabel})`}
        breadcrumb={isDeo ? 'DEO Portal' : 'Official Portal'}
      >
        {newBondHref && (
          <Button href={newBondHref} size="md">
            New Bond Entry
          </Button>
        )}
        {queueHref && data.queueCount > 0 && (
          <Button href={queueHref} variant="outline" size="md">
            <ClipboardList className="h-4 w-4" />
            My Queue ({data.queueCount})
          </Button>
        )}
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Bonds" value={data.summary.total} icon={FileText} accent="primary" />
        <StatCard
          label="Pending Approval"
          value={data.summary.pending}
          icon={Clock}
          accent="amber"
          trend={data.summary.drafts > 0 ? `${data.summary.drafts} draft(s)` : undefined}
        />
        <StatCard label="Active" value={data.summary.active} icon={CheckCircle2} accent="green" />
        <StatCard label="Rejected" value={data.summary.rejected} icon={XCircle} accent="red" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12 xl:items-start">
        <div className="xl:col-span-8">
          <DashboardCharts data={data} />
        </div>
        <div className="xl:col-span-4 space-y-4">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
              Level statistics (L1 → L{data.govLevel})
            </h2>
            <div className="space-y-4">
              {data.levelStats.map((block) => (
                <LevelStatCard key={block.level} block={block} />
              ))}
            </div>
          </div>
        </div>
      </div>

      <Card padding="none" className="overflow-hidden w-full">
        <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-semibold text-slate-800">Bond records</h2>
            <p className="text-xs text-slate-500 mt-0.5">{data.bonds.length} from database</p>
          </div>
          {queueHref && (
            <Link
              href={queueHref}
              className="text-sm font-medium text-apcrda-primary hover:underline shrink-0"
            >
              Open approval queue →
            </Link>
          )}
        </div>

        {data.bonds.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No bonds in scope"
            description={
              isDeo
                ? 'Create your first TDR bond entry to begin the approval pipeline.'
                : 'No bonds match your district or approval level yet.'
            }
            actionLabel={isDeo ? 'Create Bond Entry' : undefined}
            actionHref={isDeo ? '/deo/bonds/new' : undefined}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th className="whitespace-nowrap">TDR Number</th>
                  <th className="whitespace-nowrap">Holder</th>
                  <th className="whitespace-nowrap">Survey No.</th>
                  <th className="whitespace-nowrap text-right">Area (Sq Yds)</th>
                  <th className="whitespace-nowrap">Status</th>
                  <th className="whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.bonds.map((bond) => (
                  <tr key={bond.id}>
                    <td className="whitespace-nowrap">
                      <span className="font-semibold text-apcrda-primary">{bond.tdrNumber}</span>
                    </td>
                    <td className="max-w-[180px] truncate">{bond.holderName ?? '—'}</td>
                    <td className="font-mono text-xs whitespace-nowrap">
                      {bond.surveyNumber ?? '—'}
                    </td>
                    <td className="text-right tabular-nums whitespace-nowrap">
                      {bond.surrenderedAreaSqYds != null
                        ? bond.surrenderedAreaSqYds.toLocaleString('en-IN')
                        : '—'}
                    </td>
                    <td className="whitespace-nowrap">
                      <Badge status={bond.status} />
                    </td>
                    <td className="text-right whitespace-nowrap">
                      {bond.status === BondStatus.DRAFT && isDeo ? (
                        <Link
                          href={resumeHref(bond.id)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-apcrda-primary hover:text-apcrda-primary-light"
                        >
                          Resume
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : !isDeo && bond.status.startsWith('PENDING') ? (
                        <Link
                          href={resumeHref(bond.id)}
                          className="inline-flex items-center gap-1 text-sm font-medium text-apcrda-primary hover:text-apcrda-primary-light"
                        >
                          Review
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <span className="text-xs text-slate-400">
                          {new Date(bond.updatedAt).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
