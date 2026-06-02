// ComboChart — barras + línea en el mismo gráfico (Chart.js mixto). Útil para
// "cantidad" (barras) + "tendencia / acumulado" (línea).

import { useState } from 'react';
import { Chart } from 'react-chartjs-2';
import type { ChartData, ChartOptions, ScriptableContext } from 'chart.js';
import { cn } from '../../lib/cn.js';
import { useChartColors, withAlpha, tooltipPlugin, clickHandler, niceMax } from './chart-setup.js';
import type { BarSeries } from './MultiBarChart.js';

export interface ComboChartProps {
  labels: string[];
  bars: BarSeries[];
  line: { label?: string; color?: string; data: number[] };
  height?: number;
  showLegend?: boolean;
  onSelect?: (index: number) => void;
  className?: string;
}

export default function ComboChart({
  labels,
  bars,
  line,
  height = 300,
  showLegend = true,
  onSelect,
  className
}: ComboChartProps) {
  const cc = useChartColors();
  const lineCol = line.color ?? cc.palette[0]!;
  const [sel, setSel] = useState<number | null>(null);
  const pick = (i: number) => {
    setSel((p) => (p === i ? null : i));
    onSelect?.(i);
  };
  const yMax = niceMax([...bars.flatMap((b) => b.data), ...line.data]);

  const barDatasets = bars.map((b, i) => {
    const col = b.color ?? cc.palette[(i + 1) % cc.palette.length]!;
    return {
      type: 'bar' as const,
      label: b.label ?? `Barras ${i + 1}`,
      data: b.data,
      backgroundColor: (ctx: ScriptableContext<'bar'>) =>
        sel == null || ctx.dataIndex === sel ? col : withAlpha(col, 0.3),
      borderRadius: 6,
      borderSkipped: false,
      maxBarThickness: 42,
      order: 2
    };
  });
  const lineDataset = {
    type: 'line' as const,
    label: line.label ?? 'Línea',
    data: line.data,
    borderColor: lineCol,
    backgroundColor: withAlpha(lineCol, 0.12),
    borderWidth: 2.5,
    tension: 0.4,
    pointRadius: (ctx: ScriptableContext<'line'>) => (ctx.dataIndex === sel ? 6 : 3),
    pointBackgroundColor: lineCol,
    pointBorderWidth: 0,
    fill: false,
    order: 1
  };

  const data = {
    labels,
    datasets: [...barDatasets, lineDataset]
  } as unknown as ChartData<'bar'>;

  const options: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { top: 6 } },
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
        ticks: { color: cc.muted, font: { size: 11 } }
      },
      y: {
        border: { display: false },
        grid: { display: false },
        ticks: { color: cc.muted, font: { size: 11 } },
        beginAtZero: true,
        max: yMax
      }
    }
  };

  return (
    <div className={cn('relative w-full', className)} style={{ height }}>
      <Chart type="bar" data={data} options={options} />
    </div>
  );
}
