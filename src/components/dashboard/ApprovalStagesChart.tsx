'use client';

import { useMemo } from 'react';
import type { EChartsOption } from 'echarts';
import { Layers } from 'lucide-react';
import type { OfficialDashboardData } from '@/lib/queries/official-dashboard';
import { GOV_LEVEL_SHORT_LABELS } from '@/lib/approval-levels';
import { getApprovalLevelChartColor, getApprovalLevelChartColorMuted } from '@/lib/bond-status';
import { Card } from '@/components/ui/Card';
import { EChart } from '@/components/dashboard/EChart';

interface ApprovalStagesChartProps {
  blocks: OfficialDashboardData['levelStats'];
  isDeo?: boolean;
  height?: number;
}

export function ApprovalStagesChart({
  blocks,
  isDeo = false,
  height = 168,
}: ApprovalStagesChartProps) {
  const primaryName = isDeo ? 'Awaiting' : 'Queue';
  const secondaryName = isDeo ? 'Pipeline' : 'Forwarded';

  const option = useMemo<EChartsOption>(() => {
    const categories: string[] = [];
    const primary: number[] = [];
    const secondary: number[] = [];

    for (const block of blocks) {
      categories.push(GOV_LEVEL_SHORT_LABELS[block.level] ?? block.title);
      if (block.level === 1) {
        primary.push(block.drafts ?? 0);
        secondary.push(block.inPipeline ?? 0);
      } else {
        primary.push(block.inQueue ?? 0);
        secondary.push(block.forwarded ?? 0);
      }
    }

    const levelByIndex = blocks.map((b) => b.level);

    return {
      animationDuration: 500,
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        backgroundColor: '#fff',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#334155', fontSize: 11 },
      },
      legend: {
        top: 0,
        right: 0,
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { fontSize: 10, color: '#64748b' },
        data: [primaryName, secondaryName],
      },
      grid: {
        left: 4,
        right: 8,
        top: 26,
        bottom: 2,
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
        data: categories,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { fontSize: 10, color: '#64748b', width: 72, overflow: 'truncate' },
      },
      series: [
        {
          name: primaryName,
          type: 'bar',
          barMaxWidth: 10,
          barGap: '20%',
          data: primary.map((value, i) => ({
            value,
            itemStyle: {
              borderRadius: [0, 3, 3, 0],
              color: getApprovalLevelChartColor(levelByIndex[i] ?? 1),
            },
          })),
        },
        {
          name: secondaryName,
          type: 'bar',
          barMaxWidth: 10,
          data: secondary.map((value, i) => ({
            value,
            itemStyle: {
              borderRadius: [0, 3, 3, 0],
              color: getApprovalLevelChartColorMuted(levelByIndex[i] ?? 1),
            },
          })),
        },
      ],
    };
  }, [blocks, primaryName, secondaryName]);

  const hasData = blocks.some((b) => {
    if (b.level === 1) {
      return (b.drafts ?? 0) + (b.inPipeline ?? 0) > 0;
    }
    return (b.inQueue ?? 0) + (b.forwarded ?? 0) > 0;
  });

  return (
    <Card padding="sm" className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="mb-2 flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700 ring-1 ring-violet-100">
          <Layers className="h-3.5 w-3.5" />
        </div>
        <div className="min-w-0">
          <h2 className="text-xs font-semibold text-slate-800">Approval stages</h2>
          <p className="text-[10px] text-slate-500">Five approval roles</p>
        </div>
      </div>

      {hasData ? (
        <EChart option={option} height={height} className="min-h-0 flex-1" />
      ) : (
        <div
          className="flex flex-1 items-center justify-center rounded-xl bg-slate-50 text-xs text-slate-400"
          style={{ height }}
        >
          No stage data yet
        </div>
      )}
    </Card>
  );
}
