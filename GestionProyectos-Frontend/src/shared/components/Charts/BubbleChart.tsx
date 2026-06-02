// BubbleChart — burbujas (Chart.js): como dispersión pero el radio `r` es un
// tercer valor.

import { useState } from 'react';
import { Bubble } from 'react-chartjs-2';
import type { ChartData, ChartOptions, ScriptableContext } from 'chart.js';
import { cn } from '../../lib/cn.js';
import { useChartColors, withAlpha, tooltipPlugin, clickHandler, niceMax } from './chart-setup.js';

export interface BubbleSeries {
  label?: string;
  color?: string;
  points: Array<{ x: number; y: number; r: number }>;
}

export interface BubbleChartProps {
  series: BubbleSeries[];
  height?: number;
  showLegend?: boolean;
  onSelect?: (index: number) => void;
  className?: string;
}

export default function BubbleChart({
  series,
  height = 300,
  showLegend = true,
  onSelect,
  className
}: BubbleChartProps) {
  const cc = useChartColors();
  const [sel, setSel] = useState<number | null>(null);
  const pick = (i: number) => {
    setSel((p) => (p === i ? null : i));
    onSelect?.(i);
  };
  // Para que las burbujas del borde no se corten, expandimos el eje un poco más
  // allá del max real (en lugar de subir el padding y dejar mucho aire).
  const allPts = series.flatMap((s) => s.points);
  const maxR = Math.max(0, ...allPts.map((p) => p.r));
  const xExtra = Math.max(...allPts.map((p) => p.x)) + maxR * 0.4;
  const yExtra = Math.max(...allPts.map((p) => p.y)) + maxR * 0.4;
  const xMax = niceMax([xExtra]);
  const yMax = niceMax([yExtra]);

  const data: ChartData<'bubble'> = {
    datasets: series.map((s, i) => {
      const col = s.color ?? cc.palette[i % cc.palette.length]!;
      return {
        label: s.label ?? `Serie ${i + 1}`,
        data: s.points,
        backgroundColor: (ctx: ScriptableContext<'bubble'>) =>
          withAlpha(col, sel == null || ctx.dataIndex === sel ? 0.6 : 0.22),
        borderWidth: 0,
        hoverBackgroundColor: withAlpha(col, 0.78)
      };
    })
  };

  const options: ChartOptions<'bubble'> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: 12 },
    onClick: clickHandler(pick),
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom',
        labels: {
          color: cc.muted,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          padding: 14,
          font: { size: 11.5 }
        }
      },
      tooltip: tooltipPlugin()
    },
    scales: {
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: { color: cc.muted, font: { size: 11 } },
        min: 0,
        max: xMax
      },
      y: {
        border: { display: false },
        grid: { display: false },
        ticks: { color: cc.muted, font: { size: 11 } },
        min: 0,
        max: yMax
      }
    }
  };

  return (
    <div className={cn('relative w-full', className)} style={{ height }}>
      <Bubble data={data} options={options} />
    </div>
  );
}
