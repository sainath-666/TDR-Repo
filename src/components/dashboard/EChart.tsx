'use client';

import dynamic from 'next/dynamic';
import type { EChartsOption } from 'echarts';
import { cn } from '@/lib/utils';

const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

interface EChartProps {
  option: EChartsOption;
  className?: string;
  height?: number | string;
}

export function EChart({ option, className, height = '100%' }: EChartProps) {
  return (
    <div className={cn('min-h-0 w-full', className)} style={{ height }}>
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge
        lazyUpdate
      />
    </div>
  );
}
