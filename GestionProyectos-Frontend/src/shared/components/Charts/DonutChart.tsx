// DonutChart — dona (Chart.js). Leyenda con valor + %. Al hacer CLICK en una
// porción (o en la leyenda) el aro se LLENA por completo con esa porción y el
// centro muestra solo ese dato; en la leyenda el resto queda tachado/atenuado.
// Click de nuevo para volver a todas. Tooltip externo temático sobre la porción.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Doughnut } from 'react-chartjs-2';
import type { Chart as ChartJSType, ChartData, ChartOptions } from 'chart.js';
import { cn } from '../../lib/cn.js';
import {
  useChartColors,
  tooltipPlugin,
  clickHandler,
  hideExternalTooltip,
  type ChartDatum
} from './chart-setup.js';

export interface DonutChartProps {
  data: ChartDatum[];
  cutout?: number | string;
  centerValue?: ReactNode;
  centerLabel?: ReactNode;
  showLegend?: boolean;
  size?: number;
  onSelect?: (index: number) => void;
  selectedIndex?: number | null;
  className?: string;
}

export default function DonutChart({
  data,
  cutout = '66%',
  centerValue,
  centerLabel,
  showLegend = true,
  size = 240,
  onSelect,
  selectedIndex,
  className
}: DonutChartProps) {
  const cc = useChartColors();
  const chartRef = useRef<ChartJSType<'doughnut'>>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + Math.max(0, d.value), 0) || 1;
  const raw = selectedIndex !== undefined ? selectedIndex : picked;
  const sel = raw != null && raw >= 0 && raw < data.length ? raw : null;
  const pick = (i: number) => {
    if (selectedIndex === undefined) setPicked((p) => (p === i ? null : i));
    onSelect?.(i);
  };
  const colorAt = (i: number) => data[i]!.color ?? cc.palette[i % cc.palette.length]!;

  // Al SELECCIONAR, redistribuimos los VALORES: el elegido se queda con el total
  // y los demás van a 0. Chart.js anima ese cambio con animateRotate → el sector
  // elegido CRECE BARRIENDO el círculo hasta llenarlo (como en Apps Script).
  // Al deseleccionar, los valores vuelven a su tamaño original y se reparten.
  const filled = sel != null;
  const bg = data.map((_, i) => (filled ? colorAt(sel) : colorAt(i)));
  const values = filled
    ? data.map((_, i) => (i === sel ? total : 0))
    : data.map((d) => Math.max(0, d.value));
  const chartData: ChartData<'doughnut'> = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        data: values,
        backgroundColor: bg,
        hoverBackgroundColor: bg,
        // El borde se pinta del MISMO color del fondo → tapa la hairline blanca
        // que el antialias deja entre arcos. Inner = no agranda la dona.
        borderColor: bg,
        hoverBorderColor: bg,
        borderWidth: 2,
        borderAlign: 'inner',
        spacing: 0,
        hoverOffset: 0
      }
    ]
  };

  // Cuando cambia la selección:
  //  1) muto los `data` del chart instance directamente y llamo update() →
  //     fuerza a Chart.js a animar el cambio (a veces react-chartjs-2 reusa el
  //     update silencioso y la animación se "come" en el primer click).
  //  2) apago el tooltip externo singleton para que no quede pegado.
  useEffect(() => {
    hideExternalTooltip();
    const c = chartRef.current;
    if (!c) return;
    const ds = c.data.datasets[0];
    if (!ds) return;
    ds.data = values;
    (ds as { backgroundColor?: unknown }).backgroundColor = bg;
    (ds as { borderColor?: unknown }).borderColor = bg;
    (ds as { hoverBackgroundColor?: unknown }).hoverBackgroundColor = bg;
    c.update();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel]);

  const cVal = sel != null ? data[sel]!.value : centerValue;
  const cLab = sel != null ? data[sel]!.label : centerLabel;

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout,
    layout: { padding: 8 },
    animation: {
      animateRotate: true,
      animateScale: false,
      duration: 900,
      easing: 'easeInOutQuart'
    },
    animations: {
      colors: { type: 'color', duration: 900, easing: 'easeInOutQuart' },
      numbers: { type: 'number', duration: 900, easing: 'easeInOutQuart' }
    },
    transitions: { active: { animation: { duration: 0 } } },
    onClick: clickHandler((idx) => pick(filled ? sel : idx)),
    plugins: {
      legend: { display: false },
      tooltip: filled
        ? { enabled: false }
        : {
            ...tooltipPlugin(),
            callbacks: {
              label: (ctx) => {
                const v = Number(ctx.parsed);
                const pct = Math.round((v / total) * 100);
                return ` ${ctx.label}: ${v} (${pct}%)`;
              }
            }
          }
    }
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-6', className)}>
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <Doughnut ref={chartRef} data={chartData} options={options} />
        {(cVal != null || cLab != null) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
            {cVal != null && (
              <span className="text-[24px] font-bold leading-none text-fg">{cVal}</span>
            )}
            {cLab != null && (
              <span className="mt-1 line-clamp-2 text-[10.5px] uppercase tracking-wider text-fg-faint">
                {cLab}
              </span>
            )}
          </div>
        )}
      </div>

      {showLegend && (
        <ul className="flex min-w-0 flex-1 flex-col gap-1">
          {data.map((d, i) => {
            const pct = Math.round((Math.max(0, d.value) / total) * 100);
            const active = sel === i;
            const dim = sel != null && !active;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => pick(i)}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-2.5 rounded-md px-1.5 py-1 text-left text-[12.5px] outline-none transition-colors hover:bg-bg-muted',
                    active && 'bg-bg-muted',
                    dim && 'opacity-55'
                  )}
                >
                  <span
                    className={cn('h-2.5 w-2.5 shrink-0 rounded-full', dim && 'opacity-40')}
                    style={{ backgroundColor: colorAt(i) }}
                  />
                  <span
                    className={cn(
                      'min-w-0 flex-1 truncate text-fg-muted',
                      active && 'font-semibold text-fg',
                      dim && 'text-fg-faint line-through'
                    )}
                  >
                    {d.label}
                  </span>
                  <span
                    className={cn(
                      'shrink-0 font-semibold tabular-nums text-fg',
                      dim && 'font-normal text-fg-faint line-through'
                    )}
                  >
                    {d.value} <span className="font-normal text-fg-faint">({pct}%)</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
