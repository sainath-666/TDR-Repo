'use client';

import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { BondStatus } from '@prisma/client';
import { GitBranch } from 'lucide-react';
import type { OfficialDashboardData } from '@/lib/queries/official-dashboard';
import { GOV_LEVEL_SHORT_LABELS } from '@/lib/approval-levels';
import { BOND_STATUS_CHART_COLORS } from '@/lib/bond-status';
import { Card } from '@/components/ui/Card';
import { EChart } from '@/components/dashboard/EChart';

const PIPELINE_STAGES: { level: number; status: BondStatus }[] = [
  { level: 1, status: BondStatus.DRAFT },
  { level: 2, status: BondStatus.PENDING_L1 },
  { level: 3, status: BondStatus.PENDING_L2 },
  { level: 4, status: BondStatus.PENDING_L3 },
  { level: 5, status: BondStatus.PENDING_L4 },
];

interface BondPipelineChartProps {
  bonds: OfficialDashboardData['bonds'];
  height?: number;
}

export function BondPipelineChart({ bonds, height = 168 }: BondPipelineChartProps) {
  const option = useMemo<EChartsOption>(() => {
    const categories = PIPELINE_STAGES.map((s) => GOV_LEVEL_SHORT_LABELS[s.level] ?? `L${s.level}`);
    const values = PIPELINE_STAGES.map((s) => bonds.filter((b) => b.status === s.status).length);

    return {
      animationDuration: 500,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#fff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#334155', fontSize: 11 },
        formatter: '{b}: {c}',
      },
      grid: {
        left: 4,
        right: 4,
        top: 8,
        bottom: 4,
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: categories,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          fontSize: 10,
          interval: 0,
          rotate: categories.some((c) => c.length > 8) ? 18 : 0,
          color: (value?: string | number, index?: number) => {
            const idx = typeof index === 'number' ? index : categories.indexOf(String(value ?? ''));
            const status = PIPELINE_STAGES[idx]?.status;
            return status ? BOND_STATUS_CHART_COLORS[status] : '#64748b';
          },
        },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
        axisLabel: { fontSize: 10, color: '#94a3b8' },
      },
      series: [
        {
          type: 'bar',
          barMaxWidth: 28,
          data: values.map((value, i) => {
            const status = PIPELINE_STAGES[i]?.status ?? BondStatus.DRAFT;
            const color = BOND_STATUS_CHART_COLORS[status];
            return {
              value,
              itemStyle: {
                borderRadius: [4, 4, 0, 0],
                color,
              },
            };
          }),
          label: {
            show: true,
            position: 'top',
            fontSize: 10,
            fontWeight: 600,
            color: '#475569',
          },
        },
      ],
    };
  }, [bonds]);

  const hasData = bonds.some((b) => PIPELINE_STAGES.some((s) => s.status === b.status));

  return (
    <Card padding="sm" className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
          <GitBranch className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xs font-semibold text-slate-800">Bonds in pipeline</h2>
          <p className="text-[10px] text-slate-500">Current stage per role</p>
        </div>
      </div>

      {hasData ? (
        <EChart option={option} height={height} className="min-h-0 flex-1" />
      ) : (
        <div
          className="flex flex-1 items-center justify-center rounded-xl bg-slate-50 text-xs text-slate-400"
          style={{ height }}
        >
          No pipeline data yet
        </div>
      )}
    </Card>
  );
}
