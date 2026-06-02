// Sparkline — mini línea sin ejes ni leyenda, para tendencias compactas en
// KPIs/tarjetas (como las del Apps Script). Solo la línea + área opcional.

import { Line } from 'react-chartjs-2';
import type { ChartData, ChartOptions, ScriptableContext } from 'chart.js';
import { cn } from '../../lib/cn.js';
import { useChartColors, withAlpha } from './chart-setup.js';

export interface SparklineProps {
  points: number[];
  color?: string;
  area?: boolean;
  height?: number;
  className?: string;
}

export default function Sparkline({
  points,
  color,
  area = true,
  height = 48,
  className
}: SparklineProps) {
  const cc = useChartColors();
  const col = color ?? cc.palette[0]!;

  const data: ChartData<'line'> = {
    labels: points.map((_, i) => String(i)),
    datasets: [
      {
        data: points,
        borderColor: col,
        borderWidth: 2,
        tension: 0.4,
        fill: area,
        pointRadius: 0,
        pointHoverRadius: 0,
        backgroundColor: area
          ? (gctx: ScriptableContext<'line'>) => {
              const a = gctx.chart.chartArea;
              if (!a || a.bottom - a.top < 1) return withAlpha(col, 0.18);
              const g = gctx.chart.ctx.createLinearGradient(0, a.top, 0, a.bottom);
              g.addColorStop(0, withAlpha(col, 0.34));
              g.addColorStop(1, withAlpha(col, 0));
              return g;
            }
          : 'transparent'
      }
    ]
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    layout: { padding: 2 },
    plugins: { legend: { display: false }, tooltip: { enabled: false } },
    scales: { x: { display: false }, y: { display: false } },
    elements: { line: { capBezierPoints: true } }
  };

  return (
    <div className={cn('relative w-full', className)} style={{ height }}>
      <Line data={data} options={options} />
    </div>
  );
}
