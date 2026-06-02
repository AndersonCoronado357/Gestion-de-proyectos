// LineChart — líneas (Chart.js). tension .4, área con degradado en la 1ª
// serie, demás punteadas. Tooltip que SIGUE EL MOUSE mostrando solo la serie
// más cercana (con caret). `showPoints` controla si los puntos se ven siempre
// o solo al pasar; el punto es un círculo lleno (no corta la línea) que crece
// en hover. `onSelect` → click en un punto.

import { useEffect, useRef, useState } from 'react';
import { Line } from 'react-chartjs-2';
import type { Chart as ChartJSType, ChartData, ChartOptions, ScriptableContext } from 'chart.js';
import { cn } from '../../lib/cn.js';
import {
  useChartColors,
  withAlpha,
  tooltipPlugin,
  niceMax,
  type LineSeries
} from './chart-setup.js';

export interface LineChartProps {
  series: LineSeries[];
  labels?: string[];
  area?: boolean;
  showLegend?: boolean;
  showPoints?: boolean;
  height?: number;
  /** Click sobre la línea/área → callback con el índice de la serie. */
  onSelect?: (datasetIndex: number) => void;
  className?: string;
}

export default function LineChart({
  series,
  labels,
  area = false,
  showLegend = true,
  showPoints = true,
  height = 300,
  onSelect,
  className
}: LineChartProps) {
  const cc = useChartColors();
  // `sel` = DATASET (serie) elegido al hacer click. Cuando hay selección solo se
  // ve esa serie. Animamos manualmente la opacidad de cada dataset con rAF →
  // fade-out / fade-in suave y pulido (no el corte de `hidden:true`).
  const chartRef = useRef<ChartJSType<'line'>>(null);
  const [sel, setSel] = useState<number | null>(null);
  const pick = (di: number) => {
    setSel((p) => (p === di ? null : di));
    onSelect?.(di);
  };
  // Opacidades por serie (1 = visible, 0 = oculta). Se animan con rAF.
  const alphasRef = useRef<number[]>(series.map(() => 1));
  useEffect(() => {
    const c = chartRef.current;
    if (!c) return;
    const targets = series.map((_, i) => (sel == null || sel === i ? 1 : 0));
    const startAlphas = alphasRef.current.slice();
    if (startAlphas.length !== targets.length) {
      alphasRef.current = targets.slice();
      c.update('none');
      return;
    }
    const DUR = 500;
    const t0 = performance.now();
    let raf = 0;
    const ease = (t: number) => 1 - Math.pow(1 - t, 3); // easeOutCubic
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / DUR);
      const e = ease(t);
      alphasRef.current = startAlphas.map((s, i) => s + (targets[i]! - s) * e);
      c.update('none'); // sin re-animación, solo redraw
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);
  const yMax = niceMax(series.flatMap((s) => s.points));

  const data: ChartData<'line'> = {
    labels: labels ?? series[0]?.points.map((_, i) => String(i + 1)) ?? [],
    datasets: series.map((s, i) => {
      const col = s.color ?? cc.palette[i % cc.palette.length]!;
      const fill = s.fill ?? (area && i === 0);
      const dashed = s.dashed ?? i > 0;
      const a = () => alphasRef.current[i] ?? 1;
      return {
        label: s.label ?? `Serie ${i + 1}`,
        data: s.points,
        borderColor: (ctx: ScriptableContext<'line'>) => withAlpha(col, a()),
        backgroundColor: fill
          ? (gctx: ScriptableContext<'line'>) => {
              const ar = gctx.chart.chartArea;
              const al = a();
              if (!ar || ar.bottom - ar.top < 1) return withAlpha(col, 0.16 * al);
              const g = gctx.chart.ctx.createLinearGradient(0, ar.top, 0, ar.bottom);
              g.addColorStop(0, withAlpha(col, 0.32 * al));
              g.addColorStop(1, withAlpha(col, 0.02 * al));
              return g;
            }
          : 'transparent',
        tension: 0.4,
        fill,
        borderWidth: 2.5,
        pointRadius: (ctx: ScriptableContext<'line'>) => (a() < 0.05 ? 0 : showPoints ? 3 : 0),
        pointHoverRadius: (ctx: ScriptableContext<'line'>) => (a() < 0.05 ? 0 : showPoints ? 5 : 0),
        pointBackgroundColor: (ctx: ScriptableContext<'line'>) => withAlpha(col, a()),
        pointBorderColor: (ctx: ScriptableContext<'line'>) => withAlpha(col, a()),
        pointBorderWidth: 0,
        pointHoverBorderWidth: 0,
        borderDash: dashed ? [6, 4] : []
      };
    })
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'belowLine', intersect: false },
    layout: { padding: { top: 10 } },
    // Anima color (fade) Y números (radio del punto) → seleccionar/deseleccionar
    // una serie es un fundido suave, no un corte instantáneo.
    animation: { duration: 400, easing: 'easeOutQuart' },
    animations: {
      colors: { type: 'color', duration: 400, easing: 'easeOutQuart' },
      numbers: { type: 'number', duration: 400, easing: 'easeOutQuart' }
    },
    transitions: { active: { animation: { duration: 0 } } },
    onClick: (_e, els) => {
      if (els && els.length) pick(els[0]!.datasetIndex);
    },
    plugins: {
      legend: {
        display: showLegend,
        position: 'bottom',
        align: 'start',
        // Click en la leyenda → mismo "pick" que el click en la línea: muestra
        // SOLO esa serie (oculta las demás); click otra vez = todas otra vez.
        onClick: (_e, item) => {
          if (typeof item.datasetIndex === 'number') pick(item.datasetIndex);
        },
        labels: {
          color: cc.muted,
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: true,
          pointStyle: 'circle',
          padding: 16,
          font: { size: 11.5 }
        }
      },
      tooltip: tooltipPlugin({ belowLine: true })
    },
    scales: {
      x: {
        border: { display: false },
        grid: { display: false },
        ticks: { color: cc.muted, font: { size: 11 }, padding: 6 }
      },
      y: {
        border: { display: false },
        grid: { display: false },
        ticks: { color: cc.muted, font: { size: 11 }, padding: 8 },
        beginAtZero: true,
        max: yMax
      }
    }
  };

  return (
    <div className={cn('relative w-full', className)} style={{ height }}>
      <Line ref={chartRef} data={data} options={options} />
    </div>
  );
}
