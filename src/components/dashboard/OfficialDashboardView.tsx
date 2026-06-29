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

function LevelStatsPanel({
  blocks,
  govLevel,
}: {
  blocks: OfficialDashboardData['levelStats'];
  govLevel: number;
}) {
  return (
    <Card padding="xs" className="flex h-full min-h-0 flex-col">
      <h2 className="mb-2 shrink-0 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
        Level stats (L1 → L{govLevel})
      </h2>
      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
        {blocks.map((block) => (
          <div
            key={block.level}
            className="rounded-lg border border-slate-100 bg-slate-50/80 px-2.5 py-2"
          >
            <p className="mb-1.5 truncate text-[11px] font-semibold text-apcrda-primary">
              {block.title}
            </p>
            {block.level === 1 ? (
              <dl className="grid grid-cols-4 gap-1 text-center">
                <div>
                  <dt className="text-[10px] font-medium text-slate-600">Draft</dt>
                  <dd className="text-sm font-bold tabular-nums text-slate-800">
                    {block.drafts ?? 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-medium text-slate-600">Pipeline</dt>
                  <dd className="text-sm font-bold tabular-nums text-slate-800">
                    {block.inPipeline ?? 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-medium text-slate-600">Active</dt>
                  <dd className="text-sm font-bold tabular-nums text-emerald-700">
                    {block.active ?? 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-medium text-slate-600">Reject</dt>
                  <dd className="text-sm font-bold tabular-nums text-red-600">
                    {block.rejected ?? 0}
                  </dd>
                </div>
              </dl>
            ) : (
              <dl className="grid grid-cols-2 gap-1 text-center">
                <div>
                  <dt className="text-[10px] font-medium text-slate-600">Queue</dt>
                  <dd className="text-sm font-bold tabular-nums text-amber-700">
                    {block.inQueue ?? 0}
                  </dd>
                </div>
                <div>
                  <dt className="text-[10px] font-medium text-slate-600">Forwarded</dt>
                  <dd className="text-sm font-bold tabular-nums text-slate-800">
                    {block.forwarded ?? 0}
                  </dd>
                </div>
              </dl>
            )}
          </div>
        ))}
      </div>
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
    <div className="dashboard-shell">
      <PageHeader
        compact
        title="Dashboard"
        description={`${roleLabel} · ${data.scopeLabel}`}
        breadcrumb={isDeo ? 'DEO Portal' : 'Official Portal'}
      >
        {newBondHref && (
          <Button href={newBondHref} size="sm">
            New Bond
          </Button>
        )}
        {queueHref && data.queueCount > 0 && (
          <Button href={queueHref} variant="outline" size="sm">
            <ClipboardList className="h-3.5 w-3.5" />
            Queue ({data.queueCount})
          </Button>
        )}
      </PageHeader>

      <div className="grid shrink-0 grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard
          compact
          label="Total"
          value={data.summary.total}
          icon={FileText}
          accent="primary"
        />
        <StatCard
          compact
          label="Pending"
          value={data.summary.pending}
          icon={Clock}
          accent="amber"
          trend={data.summary.drafts > 0 ? `${data.summary.drafts} draft` : undefined}
        />
        <StatCard
          compact
          label="Active"
          value={data.summary.active}
          icon={CheckCircle2}
          accent="green"
        />
        <StatCard
          compact
          label="Rejected"
          value={data.summary.rejected}
          icon={XCircle}
          accent="red"
        />
      </div>

      <div
        className="grid shrink-0 grid-cols-1 gap-2 lg:grid-cols-12 lg:gap-3"
        style={{ height: 200 }}
      >
        <div className="min-h-0 lg:col-span-8">
          <DashboardCharts compact data={data} />
        </div>
        <div className="min-h-0 lg:col-span-4">
          <LevelStatsPanel blocks={data.levelStats} govLevel={data.govLevel} />
        </div>
      </div>

      <Card padding="none" className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-800">Bond records</h2>
            <p className="text-[11px] text-slate-600">{data.bonds.length} from database</p>
          </div>
          {queueHref && (
            <Link
              href={queueHref}
              className="shrink-0 text-xs font-medium text-apcrda-primary hover:underline"
            >
              Queue →
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
            className="py-10"
          />
        ) : (
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="data-table data-table-compact w-full">
              <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                <tr>
                  <th className="whitespace-nowrap">TDR No.</th>
                  <th className="whitespace-nowrap">Holder</th>
                  <th className="whitespace-nowrap">Survey</th>
                  <th className="whitespace-nowrap text-right">Sq Yds</th>
                  <th className="whitespace-nowrap">Status</th>
                  <th className="whitespace-nowrap text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {data.bonds.map((bond) => (
                  <tr key={bond.id}>
                    <td className="whitespace-nowrap font-semibold text-apcrda-primary">
                      {bond.tdrNumber}
                    </td>
                    <td className="max-w-[140px] truncate">{bond.holderName ?? '—'}</td>
                    <td className="whitespace-nowrap font-mono text-[11px]">
                      {bond.surveyNumber ?? '—'}
                    </td>
                    <td className="whitespace-nowrap text-right tabular-nums">
                      {bond.surrenderedAreaSqYds != null
                        ? bond.surrenderedAreaSqYds.toLocaleString('en-IN')
                        : '—'}
                    </td>
                    <td className="whitespace-nowrap">
                      <Badge status={bond.status} />
                    </td>
                    <td className="whitespace-nowrap text-right">
                      {bond.status === BondStatus.DRAFT && isDeo ? (
                        <Link
                          href={resumeHref(bond.id)}
                          className="inline-flex items-center gap-0.5 text-xs font-medium text-apcrda-primary hover:text-apcrda-primary-light"
                        >
                          Resume
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      ) : !isDeo && bond.status.startsWith('PENDING') ? (
                        <Link
                          href={resumeHref(bond.id)}
                          className="inline-flex items-center gap-0.5 text-xs font-medium text-apcrda-primary hover:text-apcrda-primary-light"
                        >
                          Review
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="text-[10px] text-slate-400">
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
