// ScatterChart — dispersión (Chart.js): puntos en ejes X/Y para correlaciones.

import { useState } from 'react';
import { Scatter } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { cn } from '../../lib/cn.js';
import { useChartColors, tooltipPlugin, clickHandler, niceMax } from './chart-setup.js';

export interface ScatterSeries {
  label?: string;
  color?: string;
  points: Array<{ x: number; y: number }>;
}

export interface ScatterChartProps {
  series: ScatterSeries[];
  height?: number;
  showLegend?: boolean;
  onSelect?: (index: number) => void;
  className?: string;
}

export default function ScatterChart({
  series,
  height = 300,
  showLegend = true,
  onSelect,
  className
}: ScatterChartProps) {
  const cc = useChartColors();
  const [sel, setSel] = useState<number | null>(null);
  const pick = (i: number) => {
    setSel((p) => (p === i ? null : i));
    onSelect?.(i);
  };
  const xMax = niceMax(series.flatMap((s) => s.points.map((p) => p.x)));
  const yMax = niceMax(series.flatMap((s) => s.points.map((p) => p.y)));

  const data: ChartData<'scatter'> = {
    datasets: series.map((s, i) => {
      const col = s.color ?? cc.palette[i % cc.palette.length]!;
      return {
        label: s.label ?? `Serie ${i + 1}`,
        data: s.points,
        backgroundColor: col,
        hoverBackgroundColor: col,
        borderWidth: 0,
        pointBorderWidth: 0,
        pointRadius: (ctx: { dataIndex: number }) => (ctx.dataIndex === sel ? 8 : 5),
        pointHoverRadius: (ctx: { dataIndex: number }) => (ctx.dataIndex === sel ? 9 : 7)
      };
    })
  };

  const options: ChartOptions<'scatter'> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: 10 },
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
      <Scatter data={data} options={options} />
    </div>
  );
}
