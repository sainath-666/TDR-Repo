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
  [BondStatus.PENDING_L1]: '#d97706',
  [BondStatus.PENDING_L2]: '#ea580c',
  [BondStatus.PENDING_L3]: '#0284c7',
  [BondStatus.PENDING_L4]: '#8b2e8b',
  [BondStatus.ACTIVE]: '#0d9488',
  [BondStatus.REJECTED]: '#dc2626',
  [BondStatus.REVOKED]: '#94a3b8',
};

const PIPELINE_COLORS = ['#1b3a6b', '#d97706', '#ea580c', '#0284c7', '#8b2e8b', '#0d9488'];

interface DashboardChartsProps {
  data: OfficialDashboardData;
  compact?: boolean;
}

export function DashboardCharts({ data, compact = false }: DashboardChartsProps) {
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
  const chartHeight = compact ? 150 : 220;
  const innerR = compact ? 32 : 52;
  const outerR = compact ? 52 : 80;

  return (
    <div
      className={
        compact
          ? 'grid h-full grid-cols-1 gap-2 sm:grid-cols-2'
          : 'grid h-full grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6'
      }
    >
      <Card padding={compact ? 'xs' : 'md'} className="flex min-h-0 flex-col">
        <h3 className="text-xs font-semibold text-slate-800">Bond status</h3>
        <p className="mb-1 text-[10px] text-slate-500">By current status</p>
        {hasBonds ? (
          <div className="min-h-0 flex-1" style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="46%"
                  innerRadius={innerR}
                  outerRadius={outerR}
                  paddingAngle={2}
                >
                  {statusData.map((entry) => (
                    <Cell key={entry.status} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number, name: string) => [value, name]}
                  contentStyle={{ borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11 }}
                />
                <Legend
                  layout="horizontal"
                  verticalAlign="bottom"
                  wrapperStyle={{ fontSize: 9, paddingTop: 4 }}
                  iconSize={8}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-xs text-slate-400">
            No data
          </div>
        )}
      </Card>

      <Card padding={compact ? 'xs' : 'md'} className="flex min-h-0 flex-col">
        <h3 className="text-xs font-semibold text-slate-800">Approval pipeline</h3>
        <p className="mb-1 text-[10px] text-slate-500">L1 → L{data.govLevel}</p>
        {hasBonds ? (
          <div className="min-h-0 flex-1" style={{ height: chartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipelineData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={28} />
                <Tooltip
                  contentStyle={{ borderRadius: 6, border: '1px solid #e2e8f0', fontSize: 11 }}
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
                <Bar dataKey="primary" fill={PIPELINE_COLORS[1]} radius={[3, 3, 0, 0]} />
                <Bar dataKey="secondary" fill={PIPELINE_COLORS[3]} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="flex flex-1 items-center justify-center text-xs text-slate-400">
            No data
          </div>
        )}
      </Card>
    </div>
  );
}
