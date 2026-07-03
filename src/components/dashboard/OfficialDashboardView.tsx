import { FileText, Clock, CheckCircle2, XCircle } from 'lucide-react';
import type { OfficialDashboardData } from '@/lib/queries/official-dashboard';
import { StatCard } from '@/components/ui/StatCard';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { DashboardCharts } from '@/components/dashboard/DashboardCharts';
import { BondPipelineChart } from '@/components/dashboard/BondPipelineChart';
import { ApprovalStagesChart } from '@/components/dashboard/ApprovalStagesChart';
import { BondRecordsTable } from '@/components/dashboard/BondRecordsTable';

interface OfficialDashboardViewProps {
  data: OfficialDashboardData;
  portal: 'deo' | 'official';
  roleLabel: string;
}

export function OfficialDashboardView({ data, portal }: OfficialDashboardViewProps) {
  const isDeo = portal === 'deo';

  return (
    <div className="dashboard-shell">
      {/* KPI cards */}
      <div className="grid shrink-0 grid-cols-2 gap-2.5 lg:grid-cols-4">
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
          trend={
            data.queueCount > 0
              ? isDeo
                ? `${data.summary.drafts} awaiting review`
                : `${data.queueCount} awaiting your review`
              : data.summary.drafts > 0
                ? `${data.summary.drafts} draft`
                : undefined
          }
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

      {/* Charts row — three equal cards */}
      <div
        className="grid shrink-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4"
        style={{ minHeight: 220 }}
      >
        <div className="min-h-[220px]">
          <DashboardCharts compact data={data} />
        </div>
        <div className="min-h-[220px]">
          <BondPipelineChart bonds={data.bonds} />
        </div>
        <div className="min-h-[220px] sm:col-span-2 lg:col-span-1">
          <ApprovalStagesChart blocks={data.levelStats} isDeo={isDeo} />
        </div>
      </div>

      {/* Bond table */}
      <div id="bond-records" className="scroll-mt-3 flex min-h-0 flex-1 flex-col">
        <Card padding="none" className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/50 px-4 py-3">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-800">Bond records</h2>
              <p className="text-[11px] text-slate-500">
                {isDeo
                  ? `${data.bonds.length} synced from external APCRDA records`
                  : `${data.bonds.length} in scope${data.queueCount > 0 ? ` · ${data.queueCount} awaiting your review` : ''}`}
              </p>
            </div>
          </div>

          {data.bonds.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No bonds in scope"
              description={
                isDeo
                  ? 'Bond records from the external APCRDA system will appear here for your review.'
                  : 'No bonds match your district or approval level yet.'
              }
              className="py-12"
            />
          ) : (
            <div className="min-h-0 flex-1 overflow-auto">
              <BondRecordsTable
                bonds={data.bonds}
                isDeo={isDeo}
                reviewQueueStatus={data.reviewQueueStatus}
              />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
