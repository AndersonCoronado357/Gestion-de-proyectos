// GaugeChart — medidor tipo velocímetro (semicírculo) construido con un
// doughnut (rotación -90, circunferencia 180). Muestra el % al centro.

import type { ReactNode } from 'react';
import { Doughnut } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { cn } from '../../lib/cn.js';
import { useChartColors } from './chart-setup.js';

export interface GaugeChartProps {
  value: number;
  max?: number;
  label?: ReactNode;
  color?: string;
  height?: number;
  className?: string;
}

export default function GaugeChart({
  value,
  max = 100,
  label,
  color,
  height = 180,
  className
}: GaugeChartProps) {
  const cc = useChartColors();
  const col = color ?? cc.palette[0]!;
  const v = Math.max(0, Math.min(value, max));
  const pct = Math.round((v / max) * 100);

  const data: ChartData<'doughnut'> = {
    labels: ['Valor', 'Resto'],
    datasets: [
      {
        data: [v, Math.max(0, max - v)],
        backgroundColor: [col, cc.surface],
        borderWidth: 0,
        circumference: 180,
        rotation: 270
      }
    ]
  };

  const options: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: { legend: { display: false }, tooltip: { enabled: false } }
  };

  return (
    <div className={cn('relative w-full', className)} style={{ height }}>
      <Doughnut data={data} options={options} />
      <div className="pointer-events-none absolute inset-x-0 bottom-[12%] flex flex-col items-center">
        <span className="text-[26px] font-bold leading-none text-fg">{pct}%</span>
        {label != null && (
          <span className="mt-1 text-[11px] uppercase tracking-wider text-fg-faint">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}
