// MultiBarChart — barras de VARIAS series (Chart.js). Agrupadas o apiladas
// (`stacked`), vertical/horizontal. Tooltip anclado, leyenda y `onSelect` →
// click en una categoría. Para `stacked`, un plugin REDIBUJA la columna
// completa por píxel (limpia el área y pinta cada segmento adyacente con
// fillRect) → garantizado sin hairlines ni gaps, sin bordes.

import { useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import type { Chart as ChartJSType, ChartData, ChartOptions, Plugin, ScriptableContext } from 'chart.js';
import { cn } from '../../lib/cn.js';
import { useChartColors, withAlpha, tooltipPlugin, clickHandler, niceMax } from './chart-setup.js';

// Plugin que redibuja cada columna apilada como un único bloque continuo de
// segmentos consecutivos sin gaps de subpíxel. Lee el COLOR RESUELTO de cada
// elemento (Chart.js ya aplica el dim del scriptable backgroundColor cuando
// hay selección) → respeta el estado de selección sin lógica duplicada.
function stackedRepaint(horizontal: boolean, fallbackColors: string[]): Plugin<'bar'> {
  return {
    id: 'stackedRepaint',
    afterDatasetsDraw(chart: ChartJSType<'bar'>) {
      const ctx = chart.ctx;
      const dsCount = chart.data.datasets.length;
      if (dsCount < 2) return;
      const sample = chart.getDatasetMeta(0).data;
      const valueScale = horizontal ? chart.scales.x : chart.scales.y;
      if (!valueScale) return;
      const baseValuePx = Math.round(valueScale.getPixelForValue(0));
      for (let xi = 0; xi < sample.length; xi++) {
        // Posicionamiento y ancho del eje "categoría" (mismo para todos los ds).
        const first = chart.getDatasetMeta(0).data[xi] as unknown as
          | {
              getProps?: (keys: string[], final?: boolean) => Record<string, number>;
              options?: { backgroundColor?: string };
            }
          | undefined;
        if (!first || typeof first.getProps !== 'function') continue;
        const props = first.getProps(['x', 'y', 'width', 'height'], true);
        const cx = horizontal ? props.y ?? 0 : props.x ?? 0;
        const cw = horizontal ? props.height ?? 0 : props.width ?? 0;
        if (cw <= 0) continue;
        const left = Math.round(cx - cw / 2);
        const wpx = Math.round(cw);
        // Acumular valores y colores RESUELTOS por Chart.js para cada segmento.
        let cumulative = 0;
        const stack: Array<{ value: number; color: string }> = [];
        for (let di = 0; di < dsCount; di++) {
          const meta = chart.getDatasetMeta(di);
          if (meta.hidden) continue;
          const v = Number(chart.data.datasets[di].data[xi]) || 0;
          if (v === 0) continue;
          const el = meta.data[xi] as unknown as
            | { options?: { backgroundColor?: string } }
            | undefined;
          const resolved = el?.options?.backgroundColor;
          const color =
            typeof resolved === 'string' && resolved && resolved !== 'transparent'
              ? resolved
              : fallbackColors[di] ?? fallbackColors[0] ?? '#999';
          stack.push({ value: v, color });
          cumulative += v;
        }
        if (stack.length === 0) continue;
        const totalEndPx = Math.round(valueScale.getPixelForValue(cumulative));
        // Limpiar la columna entera (margen por antialias del render previo).
        const minPx = Math.min(baseValuePx, totalEndPx);
        const maxPx = Math.max(baseValuePx, totalEndPx);
        if (horizontal) {
          ctx.clearRect(minPx - 1, left - 1, maxPx - minPx + 2, wpx + 2);
        } else {
          ctx.clearRect(left - 1, minPx - 1, wpx + 2, maxPx - minPx + 2);
        }
        // Repintar segmento por segmento, ADYACENTES (sin gap).
        let acc = 0;
        for (const seg of stack) {
          const start = acc;
          const end = acc + seg.value;
          acc = end;
          const sPx = Math.round(valueScale.getPixelForValue(start));
          const ePx = Math.round(valueScale.getPixelForValue(end));
          ctx.fillStyle = seg.color;
          if (horizontal) {
            const x0 = Math.min(sPx, ePx);
            const x1 = Math.max(sPx, ePx);
            ctx.fillRect(x0, left, x1 - x0, wpx);
          } else {
            const y0 = Math.min(sPx, ePx);
            const y1 = Math.max(sPx, ePx);
            ctx.fillRect(left, y0, wpx, y1 - y0);
          }
        }
      }
    }
  };
}

export interface BarSeries {
  label?: string;
  color?: string;
  data: number[];
}

export interface MultiBarChartProps {
  labels: string[];
  series: BarSeries[];
  stacked?: boolean;
  orientation?: 'vertical' | 'horizontal';
  height?: number;
  showLegend?: boolean;
  onSelect?: (index: number) => void;
  className?: string;
}

export default function MultiBarChart({
  labels,
  series,
  stacked = false,
  orientation = 'vertical',
  height = 300,
  showLegend = true,
  onSelect,
  className
}: MultiBarChartProps) {
  const cc = useChartColors();
  const horizontal = orientation === 'horizontal';
  const [sel, setSel] = useState<number | null>(null);
  const pick = (i: number) => {
    setSel((p) => (p === i ? null : i));
    onSelect?.(i);
  };
  const vMax = stacked
    ? niceMax(labels.map((_, i) => series.reduce((a, s) => a + (s.data[i] || 0), 0)))
    : niceMax(series.flatMap((s) => s.data));
  const seriesColors = series.map((s, i) => s.color ?? cc.palette[i % cc.palette.length]!);
  const repaintPlugin = useMemo(
    () => stackedRepaint(horizontal, seriesColors),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [horizontal, seriesColors.join('|')]
  );

  const data: ChartData<'bar'> = {
    labels,
    datasets: series.map((s, i) => {
      const color = s.color ?? cc.palette[i % cc.palette.length]!;
      return {
      label: s.label ?? `Serie ${i + 1}`,
      data: s.data,
      backgroundColor: (ctx: ScriptableContext<'bar'>) =>
        sel == null || ctx.dataIndex === sel ? color : withAlpha(color, 0.3),
      borderColor: 'transparent',
      hoverBorderColor: 'transparent',
      borderWidth: 0,
      borderRadius: stacked ? 0 : 6,
      borderSkipped: false,
      maxBarThickness: 46
      };
    })
  };

  const options: ChartOptions<'bar'> = {
    indexAxis: horizontal ? 'y' : 'x',
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
        stacked,
        border: { display: false },
        grid: { display: false },
        ticks: { color: cc.muted, font: { size: 11 } },
        beginAtZero: true,
        max: horizontal ? vMax : undefined
      },
      y: {
        stacked,
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
      <Bar data={data} options={options} plugins={stacked ? [repaintPlugin] : []} />
    </div>
  );
}
