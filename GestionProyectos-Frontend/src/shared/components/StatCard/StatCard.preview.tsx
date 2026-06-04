import StatCard from './StatCard.js';

export const meta = { id: 'stat-card', name: 'StatCard (KPI)' };

export default function StatCardPreview() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard label="Ingresos del mes" value="$ 12.480" delta={8.4} footer="vs mes anterior" />
      <StatCard label="Usuarios activos" value="1.342" delta={-2.1} footer="últimos 7 días" />
      <StatCard label="Tasa de error" value="0.42 %" footer="estable" />
    </div>
  );
}
