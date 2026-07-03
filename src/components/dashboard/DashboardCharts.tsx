'use client';

import { useMemo, type ReactNode } from 'react';
import type { EChartsOption } from 'echarts';
import { BondStatus } from '@prisma/client';
import { PieChart } from 'lucide-react';
import type { OfficialDashboardData } from '@/lib/queries/official-dashboard';
import { BOND_STATUS_CHART_COLORS, BOND_STATUS_ORDER, formatBondStatus } from '@/lib/bond-status';
import { Card } from '@/components/ui/Card';
import { EChart } from '@/components/dashboard/EChart';

interface DashboardChartsProps {
  data: OfficialDashboardData;
  compact?: boolean;
}

function chartTitle(title: string, subtitle: string, icon: ReactNode) {
  return (
    <div className="mb-2 flex items-start justify-between gap-2">
      <div className="min-w-0">
        <h3 className="text-xs font-semibold text-slate-800">{title}</h3>
        <p className="text-[10px] text-slate-500">{subtitle}</p>
      </div>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-apcrda-primary ring-1 ring-indigo-100">
        {icon}
      </div>
    </div>
  );
}

export function DashboardCharts({ data, compact = false }: DashboardChartsProps) {
  const hasBonds = data.bonds.length > 0;
  const chartHeight = compact ? 168 : 240;

  const statusBarOption = useMemo<EChartsOption>(() => {
    const counts = new Map<BondStatus, number>();
    for (const bond of data.bonds) {
      counts.set(bond.status, (counts.get(bond.status) ?? 0) + 1);
    }

    const entries = BOND_STATUS_ORDER.map((status) => ({
      status,
      label: formatBondStatus(status),
      value: counts.get(status) ?? 0,
      color: BOND_STATUS_CHART_COLORS[status],
    })).filter((e) => e.value > 0);

    return {
      animationDuration: 600,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#fff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#334155', fontSize: 11 },
        formatter: (params: unknown) => {
          const items = Array.isArray(params) ? params : [params];
          const first = items[0] as { name?: string; value?: number | string } | undefined;
          if (!first) return '';
          return `${first.name ?? ''}: ${first.value ?? 0}`;
        },
      },
      grid: {
        left: 4,
        right: 12,
        top: 4,
        bottom: 4,
        containLabel: true,
      },
      xAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: { fontSize: 10, color: '#94a3b8' },
      },
      yAxis: {
        type: 'category',
        data: entries.map((e) => e.label),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 10,
          color: '#64748b',
          width: compact ? 88 : 110,
          overflow: 'truncate',
        },
      },
      series: [
        {
          type: 'bar',
          barMaxWidth: compact ? 14 : 18,
          data: entries.map((e) => ({
            value: e.value,
            itemStyle: {
              borderRadius: [0, 4, 4, 0],
              color: e.color,
            },
          })),
          label: {
            show: true,
            position: 'right',
            fontSize: 10,
            fontWeight: 600,
            color: '#475569',
          },
        },
      ],
    };
  }, [compact, data.bonds]);

  return (
    <Card padding={compact ? 'sm' : 'md'} className="flex h-full min-h-0 flex-col overflow-hidden">
      {chartTitle(
        'Bond status',
        'Distribution by current status',
        <PieChart className="h-3.5 w-3.5" />,
      )}
      {hasBonds ? (
        <EChart option={statusBarOption} height={chartHeight} />
      ) : (
        <div
          className="flex flex-1 items-center justify-center rounded-xl bg-slate-50 text-xs text-slate-400"
          style={{ height: chartHeight }}
        >
          No bond data yet
        </div>
      )}
    </Card>
  );
}
