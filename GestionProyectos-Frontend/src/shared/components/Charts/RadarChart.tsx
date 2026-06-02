// RadarChart — radar / araña (Chart.js). Reutiliza LineSeries { label, color,
// points }. Tooltip que sigue el mouse y `onSelect` → click en un eje.

import { useEffect, useRef, useState } from 'react';
import { Radar } from 'react-chartjs-2';
import type { Chart as ChartJSType, ChartData, ChartOptions } from 'chart.js';
import { cn } from '../../lib/cn.js';
import {
  useChartColors,
  withAlpha,
  tooltipPlugin,
  niceMax,
  type LineSeries
} from './chart-setup.js';

export interface RadarChartProps {
  labels: string[];
  series: LineSeries[];
  height?: number;
  showLegend?: boolean;
  /** Click sobre la araña/leyenda → callback con el índice de la serie. */
  onSelect?: (datasetIndex: number) => void;
  className?: string;
}

export default function RadarChart({
  labels,
  series,
  height = 320,
  showLegend = true,
  onSelect,
  className
}: RadarChartProps) {
  const cc = useChartColors();
  // `sel` = DATASET elegido al hacer click. Solo esa visible; click otra vez =
  // todas otra vez. Animamos la opacidad por dataset con rAF → fade pulido.
  const chartRef = useRef<ChartJSType<'radar'>>(null);
  const [sel, setSel] = useState<number | null>(null);
  const pick = (di: number) => {
    setSel((p) => (p === di ? null : di));
    onSelect?.(di);
  };
  const alphasRef = useRef<number[]>(series.map(() => 1));
  useEffect(() => {
    const c = chartRef.current;
    if (!c) return;
    const targets = series.map((_, i) => (sel == null || sel === i ? 1 : 0));
    const start = alphasRef.current.slice();
    if (start.length !== targets.length) {
      alphasRef.current = targets.slice();
      c.update('none');
      return;
    }
    const DUR = 500;
    const t0 = performance.now();
    let raf = 0;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / DUR);
      const e = ease(t);
      alphasRef.current = start.map((s, i) => s + (targets[i]! - s) * e);
      c.update('none');
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);
  const rMax = niceMax(series.flatMap((s) => s.points));

  const data: ChartData<'radar'> = {
    labels,
    datasets: series.map((s, i) => {
      const col = s.color ?? cc.palette[i % cc.palette.length]!;
      const a = () => alphasRef.current[i] ?? 1;
      return {
        label: s.label ?? `Serie ${i + 1}`,
        data: s.points,
        borderColor: () => withAlpha(col, a()),
        backgroundColor: () => withAlpha(col, 0.18 * a()),
        borderWidth: 2,
        pointBackgroundColor: () => withAlpha(col, a()),
        pointBorderColor: () => withAlpha(col, a()),
        pointBorderWidth: 0,
        pointRadius: () => (a() < 0.05 ? 0 : 3),
        pointHoverRadius: () => (a() < 0.05 ? 0 : 5)
      };
    })
  };

  const options: ChartOptions<'radar'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'nearest', intersect: false },
    animation: { duration: 400, easing: 'easeOutQuart' },
    onClick: (_e, els) => {
      if (els && els.length) pick(els[0]!.datasetIndex);
    },
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom',
        onClick: (_e, item) => {
          if (typeof item.datasetIndex === 'number') pick(item.datasetIndex);
        },
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
      r: {
        grid: { color: cc.grid },
        angleLines: { color: cc.grid },
        pointLabels: { color: cc.muted, font: { size: 11.5 } },
        ticks: { display: false, backdropColor: 'transparent' },
        beginAtZero: true,
        max: rMax
      }
    }
  };

  return (
    <div className={cn('relative w-full', className)} style={{ height }}>
      <Radar ref={chartRef} data={data} options={options} />
    </div>
  );
}
