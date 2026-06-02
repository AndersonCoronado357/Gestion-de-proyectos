// PolarAreaChart — área polar (Chart.js): porciones desde el centro con radio
// proporcional al valor. Tooltip que sigue el mouse, leyenda y CLICK para
// seleccionar (resalta el elegido, atenúa el resto).

import { useState } from 'react';
import { PolarArea } from 'react-chartjs-2';
import type { ChartData, ChartOptions } from 'chart.js';
import { cn } from '../../lib/cn.js';
import {
  useChartColors,
  withAlpha,
  tooltipPlugin,
  clickHandler,
  type ChartDatum
} from './chart-setup.js';

export interface PolarAreaChartProps {
  data: ChartDatum[];
  height?: number;
  showLegend?: boolean;
  onSelect?: (index: number) => void;
  selectedIndex?: number | null;
  className?: string;
}

export default function PolarAreaChart({
  data,
  height = 300,
  showLegend = true,
  onSelect,
  selectedIndex,
  className
}: PolarAreaChartProps) {
  const cc = useChartColors();
  const [picked, setPicked] = useState<number | null>(null);
  const sel = selectedIndex !== undefined ? selectedIndex : picked;
  const pick = (i: number) => {
    if (selectedIndex === undefined) setPicked((p) => (p === i ? null : i));
    onSelect?.(i);
  };
  const baseColor = (i: number) => data[i]!.color ?? cc.palette[i % cc.palette.length]!;
  const fills = data.map((_, i) =>
    withAlpha(baseColor(i), sel != null && sel !== i ? 0.15 : 0.85)
  );

  const chartData: ChartData<'polarArea'> = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        data: data.map((d) => Math.max(0, d.value)),
        backgroundColor: fills,
        borderColor: 'transparent',
        borderWidth: 0
      }
    ]
  };

  const options: ChartOptions<'polarArea'> = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: clickHandler(pick),
    plugins: {
      legend: {
        display: showLegend,
        position: 'right',
        labels: {
          color: cc.muted,
          usePointStyle: true,
          pointStyle: 'circle',
          boxWidth: 8,
          padding: 12,
          font: { size: 11.5 }
        }
      },
      tooltip: tooltipPlugin()
    },
    scales: {
      r: {
        grid: { color: cc.grid },
        angleLines: { color: cc.grid },
        ticks: { display: false, backdropColor: 'transparent' },
        beginAtZero: true
      }
    }
  };

  return (
    <div className={cn('relative w-full', className)} style={{ height }}>
      <PolarArea data={chartData} options={options} />
    </div>
  );
}
