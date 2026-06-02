// BarChart — barras (Chart.js) verticales u horizontales, redondeadas, con el
// valor encima, tooltip que sigue el mouse y CLICK para seleccionar (resalta
// la barra elegida y atenúa el resto).

import { useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions, Plugin } from 'chart.js';
import { cn } from '../../lib/cn.js';
import {
  useChartColors,
  withAlpha,
  tooltipPlugin,
  clickHandler,
  niceMax,
  type ChartDatum
} from './chart-setup.js';

function valueLabels(color: string): Plugin<'bar'> {
  return {
    id: 'valueLabels',
    afterDatasetsDraw(chart) {
      const ds = chart.data.datasets[0];
      if (!ds) return;
      const meta = chart.getDatasetMeta(0);
      const horizontal = chart.options.indexAxis === 'y';
      const { ctx } = chart;
      ctx.save();
      ctx.fillStyle = color;
      ctx.font = '600 11px Inter, system-ui, sans-serif';
      meta.data.forEach((el, i) => {
        const v = ds.data[i];
        if (v == null) return;
        const p = el as unknown as { x: number; y: number };
        if (horizontal) {
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(String(v), p.x + 6, p.y);
        } else {
          ctx.textAlign = 'center';
          ctx.textBaseline = 'bottom';
          ctx.fillText(String(v), p.x, p.y - 6);
        }
      });
      ctx.restore();
    }
  };
}

export interface BarChartProps {
  data: ChartDatum[];
  orientation?: 'vertical' | 'horizontal';
  height?: number;
  onSelect?: (index: number) => void;
  selectedIndex?: number | null;
  className?: string;
}

export default function BarChart({
  data,
  orientation = 'vertical',
  height = 300,
  onSelect,
  selectedIndex,
  className
}: BarChartProps) {
  const cc = useChartColors();
  const [picked, setPicked] = useState<number | null>(null);
  const sel = selectedIndex !== undefined ? selectedIndex : picked;
  const pick = (i: number) => {
    if (selectedIndex === undefined) setPicked((p) => (p === i ? null : i));
    onSelect?.(i);
  };
  const horizontal = orientation === 'horizontal';
  const baseColor = (i: number) => data[i]!.color ?? cc.palette[i % cc.palette.length]!;
  const colors = data.map((_, i) =>
    sel != null && sel !== i ? withAlpha(baseColor(i), 0.3) : baseColor(i)
  );
  const vMax = niceMax(data.map((d) => d.value));

  const chartData: ChartData<'bar'> = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        data: data.map((d) => d.value),
        backgroundColor: colors,
        hoverBackgroundColor: colors,
        borderRadius: 8,
        borderSkipped: false,
        maxBarThickness: 52
      }
    ]
  };

  const plugin = useMemo(() => valueLabels(cc.muted), [cc.muted]);

  const options: ChartOptions<'bar'> = {
    indexAxis: horizontal ? 'y' : 'x',
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'nearest', intersect: true },
    layout: { padding: { top: 18, right: horizontal ? 38 : 8 } },
    onClick: clickHandler(pick),
    plugins: { legend: { display: false }, tooltip: tooltipPlugin() },
    scales: {
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: { color: cc.muted, font: { size: 11 } },
        beginAtZero: true,
        max: horizontal ? vMax : undefined
      },
      y: {
        border: { display: false },
        grid: { display: false },
        ticks: { color: cc.muted, font: { size: 11 } },
        beginAtZero: true,
        max: horizontal ? undefined : vMax
      }
    }
  };

  return (
    <div className={cn('relative w-full', className)} style={{ height }}>
      <Bar data={chartData} options={options} plugins={[plugin]} />
    </div>
  );
}
