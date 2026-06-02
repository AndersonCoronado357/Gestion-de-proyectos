// GanttChart — cronograma (Chart.js barras horizontales "flotantes"): cada
// tarea va de `start` a `end`. Tooltip que sigue el mouse (rango + duración) y
// `onSelect` → click en una tarea.

import { useState } from 'react';
import { Bar } from 'react-chartjs-2';
import type { ChartData, ChartOptions, ScriptableContext } from 'chart.js';
import { cn } from '../../lib/cn.js';
import {
  useChartColors,
  withAlpha,
  tooltipPlugin,
  clickHandler,
  type GanttTask
} from './chart-setup.js';

export interface GanttChartProps {
  tasks: GanttTask[];
  total: number;
  height?: number;
  onSelect?: (index: number) => void;
  className?: string;
}

export default function GanttChart({
  tasks,
  total,
  height,
  onSelect,
  className
}: GanttChartProps) {
  const cc = useChartColors();
  const [sel, setSel] = useState<number | null>(null);
  const pick = (i: number) => {
    setSel((p) => (p === i ? null : i));
    onSelect?.(i);
  };
  const colors = tasks.map((t, i) => t.color ?? cc.palette[i % cc.palette.length]!);

  const data: ChartData<'bar'> = {
    labels: tasks.map((t) => t.label),
    datasets: [
      {
        data: tasks.map((t) => [t.start, t.end] as [number, number]),
        backgroundColor: (ctx: ScriptableContext<'bar'>) =>
          sel == null || ctx.dataIndex === sel
            ? colors[ctx.dataIndex]!
            : withAlpha(colors[ctx.dataIndex]!, 0.3),
        borderRadius: 6,
        borderSkipped: false,
        barThickness: 22
      }
    ]
  };

  const options: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: { right: 8 } },
    onClick: clickHandler(pick),
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipPlugin(),
        callbacks: {
          label: (ctx) => {
            const r = ctx.raw as [number, number];
            return ` ${r[0]} → ${r[1]}  (${r[1] - r[0]})`;
          }
        }
      }
    },
    scales: {
      x: {
        min: 0,
        max: total,
        border: { display: false },
        grid: { display: false },
        ticks: { color: cc.muted, stepSize: 1, font: { size: 10.5 } }
      },
      y: {
        border: { display: false },
        grid: { display: false },
        ticks: { color: cc.muted, font: { size: 11.5 } }
      }
    }
  };

  const h = height ?? Math.max(160, tasks.length * 46 + 48);

  return (
    <div className={cn('relative w-full', className)} style={{ height: h }}>
      <Bar data={data} options={options} />
    </div>
  );
}
