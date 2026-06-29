'use client';

import { useMemo } from 'react';
import { BondStatus } from '@prisma/client';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { OfficialDashboardData } from '@/lib/queries/official-dashboard';
import { formatBondStatus } from '@/lib/bond-status';
import { Card } from '@/components/ui/Card';

const STATUS_COLORS: Record<string, string> = {
  [BondStatus.DRAFT]: '#64748b',
  [BondStatus.PENDING_L1]: '#f59e0b',
  [BondStatus.PENDING_L2]: '#f97316',
  [BondStatus.PENDING_L3]: '#3b82f6',
  [BondStatus.PENDING_L4]: '#8b5cf6',
  [BondStatus.ACTIVE]: '#10b981',
  [BondStatus.REJECTED]: '#ef4444',
  [BondStatus.REVOKED]: '#9ca3af',
};

const PIPELINE_COLORS = ['#1e3a5f', '#f59e0b', '#f97316', '#3b82f6', '#8b5cf6', '#10b981'];

interface DashboardChartsProps {
  data: OfficialDashboardData;
}

export function DashboardCharts({ data }: DashboardChartsProps) {
  const statusData = useMemo(() => {
    const counts = new Map<BondStatus, number>();
    for (const bond of data.bonds) {
      counts.set(bond.status, (counts.get(bond.status) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([status, value]) => ({
      status,
      name: formatBondStatus(status),
      value,
      fill: STATUS_COLORS[status] ?? '#94a3b8',
    }));
  }, [data.bonds]);

  const pipelineData = useMemo(() => {
    return data.levelStats.map((block) => {
      if (block.level === 1) {
        return {
          name: 'L1',
          fullName: block.title,
          primary: block.drafts ?? 0,
          secondary: block.inPipeline ?? 0,
          primaryLabel: 'Drafts',
          secondaryLabel: 'In pipeline',
        };
      }
      return {
        name: `L${block.level}`,
        fullName: block.title,
        primary: block.inQueue ?? 0,
        secondary: block.forwarded ?? 0,
        primaryLabel: 'In queue',
        secondaryLabel: 'Forwarded',
      };
    });
  }, [data.levelStats]);

  const hasBonds = data.bonds.length > 0;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6 h-full">
      <Card className="flex flex-col min-h-[300px]">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Bond status distribution</h3>
        <p className="text-xs text-slate-500 mb-4">Breakdown by current status</p>
        {hasBonds ? (
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [value, name]}
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
            No data to chart
          </div>
        )}
      </Card>

      <Card className="flex flex-col min-h-[300px]">
        <h3 className="text-sm font-semibold text-slate-800 mb-1">Approval pipeline</h3>
        <p className="text-xs text-slate-500 mb-4">Cumulative levels L1 → L{data.govLevel}</p>
        {hasBonds ? (
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                  labelFormatter={(_, payload) =>
                    payload?.[0]?.payload?.fullName ? String(payload[0].payload.fullName) : ''
                  }
                  formatter={(
                    value: number,
                    _name: string,
                    item: {
                      payload?: { primaryLabel?: string; secondaryLabel?: string };
                      dataKey?: string;
                    },
                  ) => {
                    const label =
                      item.dataKey === 'primary'
                        ? item.payload?.primaryLabel
                        : item.payload?.secondaryLabel;
                    return [value, label ?? ''];
                  }}
                />
                <Bar dataKey="primary" fill={PIPELINE_COLORS[1]} radius={[4, 4, 0, 0]} />
                <Bar dataKey="secondary" fill={PIPELINE_COLORS[3]} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
            No data to chart
          </div>
        )}
      </Card>
    </div>
  );
}
