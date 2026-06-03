// Página principal del módulo Logs.
//
// Layout (sin alterar el componente DataTable):
//   1. Header (título + subtítulo).
//   2. Grid de StatCard con KPIs.
//   3. Card con la barra de filtros extra (SearchInput + 3 Select +
//      Switch auto-refresh) — POR ENCIMA del card de la tabla.
//   4. Card con el DataTable nativo (mantiene su propio toolbar/búsqueda).
//   5. Panel lateral 340px con el detalle.

import { useMemo } from 'react';
import { cn } from '../../../../shared/lib/cn.js';
import DataTable, {
  type ColumnDef
} from '../../../../shared/components/DataTable/index.js';
import Skeleton from '../../../../shared/components/Skeleton/index.js';
import StatCard from '../../../../shared/components/StatCard/index.js';
import FilterBar from '../../../../shared/components/FilterBar/index.js';
import LevelChip from '../../../../shared/components/LevelChip/index.js';
import TagChip from '../../../../shared/components/TagChip/index.js';
import LogDetailPanel from '../components/LogDetailPanel.js';
import { useLogsBuilder } from '../hooks/useLogsBuilder.js';
import type {
  LogCategory,
  LogLevel,
  LogSource,
  RemoteLogEntry
} from '../../api.js';

const LEVEL_OPTS: ReadonlyArray<{ value: LogLevel; label: string }> = [
  { value: 'error', label: 'Error' },
  { value: 'warn', label: 'Advertencia' },
  { value: 'info', label: 'Info' },
  { value: 'debug', label: 'Debug' },
  { value: 'audit', label: 'Auditoría' }
];
const SOURCE_OPTS: ReadonlyArray<{ value: LogSource; label: string }> = [
  { value: 'frontend', label: 'Frontend' },
  { value: 'backend', label: 'Backend' }
];
const CATEGORY_OPTS: ReadonlyArray<{ value: LogCategory; label: string }> = [
  { value: 'http', label: 'HTTP' },
  { value: 'exception', label: 'Excepción' },
  { value: 'app', label: 'Aplicación' },
  { value: 'audit', label: 'Auditoría' },
  { value: 'console', label: 'Consola' }
];

type AutoOption = '5' | '15' | '30' | '60';
const AUTO_OPTS: ReadonlyArray<{ value: AutoOption; label: string }> = [
  { value: '5', label: 'Auto · 5 s' },
  { value: '15', label: 'Auto · 15 s' },
  { value: '30', label: 'Auto · 30 s' },
  { value: '60', label: 'Auto · 60 s' }
];

interface Row extends RemoteLogEntry {
  _id: number;
}

function fmtTime(iso: string): string {
  try {
    const d = new Date(iso);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString()}`;
  } catch {
    return iso;
  }
}

function buildColumns(panelOpen: boolean): ColumnDef<Row>[] {
  return [
    {
      id: 'occurredAt',
      label: 'Hora',
      accessor: (r) => r.occurredAt,
      width: panelOpen ? 150 : 175,
      render: (r) => (
        <span className="font-mono text-[11.5px] text-fg-muted">
          {fmtTime(r.occurredAt)}
        </span>
      )
    },
    {
      id: 'level',
      label: 'Nivel',
      accessor: (r) => r.level,
      filter: 'select',
      filterLabelFor: (raw) =>
        ({
          error: 'Error',
          warn: 'Advertencia',
          info: 'Info',
          debug: 'Debug',
          audit: 'Auditoría'
        })[raw as LogLevel] ?? raw,
      width: panelOpen ? 110 : 130,
      render: (r) => <LevelChip level={r.level} />
    },
    {
      id: 'source',
      label: 'Origen',
      accessor: (r) => r.source,
      filter: 'select',
      filterLabelFor: (raw) =>
        ({ frontend: 'Frontend', backend: 'Backend' })[raw as LogSource] ?? raw,
      width: 105,
      render: (r) => (
        <span className="text-[12px] capitalize text-fg-muted">{r.source}</span>
      )
    },
    {
      id: 'category',
      label: 'Categoría',
      accessor: (r) => r.category,
      filter: 'select',
      filterLabelFor: (raw) =>
        ({
          http: 'HTTP',
          exception: 'Excepción',
          app: 'Aplicación',
          audit: 'Auditoría',
          console: 'Consola'
        })[raw as LogCategory] ?? raw,
      width: 110,
      render: (r) => <TagChip uppercase>{r.category}</TagChip>
    },
    {
      id: 'message',
      label: 'Mensaje',
      accessor: (r) => r.message,
      sortable: false,
      render: (r) => (
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-[12.5px] font-medium text-fg">
            {r.message}
          </span>
          {r.loggerName && (
            <span className="truncate text-[10.5px] text-fg-faint">
              {r.loggerName}
            </span>
          )}
        </div>
      )
    },
    {
      id: 'status',
      label: 'Status',
      accessor: (r) => r.httpStatus ?? 0,
      width: 80,
      render: (r) =>
        r.httpStatus != null ? (
          <span className="font-mono text-[11.5px] text-fg-muted">
            {r.httpStatus}
          </span>
        ) : (
          <span className="text-fg-faint">—</span>
        )
    },
    {
      id: 'duration',
      label: 'Duración',
      accessor: (r) => r.durationMs ?? 0,
      width: 90,
      render: (r) =>
        r.durationMs != null ? (
          <span className="font-mono text-[11.5px] text-fg-muted">
            {r.durationMs} ms
          </span>
        ) : (
          <span className="text-fg-faint">—</span>
        )
    }
  ];
}

function buildSkeletonRows(): Row[] {
  return Array.from({ length: 8 }, (_, i) => ({
    _id: -1 - i,
    occurredAt: new Date().toISOString(),
    level: 'info',
    source: 'frontend',
    category: 'app',
    message: '',
    loggerName: ''
  }));
}
function buildSkeletonColumns(panelOpen: boolean): ColumnDef<Row>[] {
  const sk = (w: string | number) => (
    <Skeleton variant="text" width={w} height={12} />
  );
  return [
    {
      id: 'occurredAt',
      label: 'Hora',
      accessor: () => '',
      width: panelOpen ? 150 : 175,
      sortable: false,
      render: () => sk(120)
    },
    {
      id: 'level',
      label: 'Nivel',
      accessor: () => '',
      width: panelOpen ? 110 : 130,
      sortable: false,
      render: () => sk(70)
    },
    {
      id: 'source',
      label: 'Origen',
      accessor: () => '',
      width: 105,
      sortable: false,
      render: () => sk(55)
    },
    {
      id: 'category',
      label: 'Categoría',
      accessor: () => '',
      width: 110,
      sortable: false,
      render: () => sk(60)
    },
    {
      id: 'message',
      label: 'Mensaje',
      accessor: () => '',
      sortable: false,
      render: () => sk('80%')
    },
    {
      id: 'status',
      label: 'Status',
      accessor: () => '',
      width: 80,
      sortable: false,
      render: () => sk(30)
    },
    {
      id: 'duration',
      label: 'Duración',
      accessor: () => '',
      width: 90,
      sortable: false,
      render: () => sk(40)
    }
  ];
}

export default function LogsPage() {
  const b = useLogsBuilder();
  const panelOpen = !!b.selected || b.selectedLoading;

  const rows: Row[] = useMemo(
    () => b.list.items.map((e) => ({ ...e, _id: e.id ?? 0 })),
    [b.list.items]
  );

  const columns = useMemo(
    () => (b.loading ? buildSkeletonColumns(panelOpen) : buildColumns(panelOpen)),
    [b.loading, panelOpen]
  );

  const data = b.loading ? buildSkeletonRows() : rows;

  const currentLevel: LogLevel | null = b.filters.levels[0] ?? null;
  const currentSource: LogSource | null = b.filters.sources[0] ?? null;
  const currentCategory: LogCategory | null = b.filters.categories[0] ?? null;
  const currentAuto: AutoOption | null =
    b.filters.autoRefreshSec > 0
      ? (String(b.filters.autoRefreshSec) as AutoOption)
      : null;

  return (
    <div className="flex h-full gap-4 overflow-hidden p-3 sm:p-4 lg:p-8">
      <div
        className={cn(
          'h-full min-w-0 flex-1 flex-col gap-4 overflow-y-auto',
          panelOpen ? 'hidden md:flex' : 'flex'
        )}
      >
        <div className="shrink-0">
          <h2 className="text-[18px] font-bold tracking-tight text-fg">
            Bitácora
          </h2>
          <p className="mt-0.5 text-[11px] text-fg-faint">
            Registro centralizado de todo lo que ocurre en la aplicación.
          </p>
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            label="Eventos totales"
            value={b.summary?.total?.toLocaleString() ?? '—'}
            footer="Históricos en la base"
          />
          <StatCard
            label="Últimas 24 horas"
            value={b.summary?.last24h?.toLocaleString() ?? '—'}
            footer="Volumen reciente"
          />
          <StatCard
            label="Errores 24h"
            value={b.summary?.errorsLast24h?.toLocaleString() ?? '—'}
            footer={
              b.summary && b.summary.last24h > 0
                ? `${Math.round((b.summary.errorsLast24h / b.summary.last24h) * 100)}% del tráfico`
                : 'Sin actividad'
            }
          />
          <StatCard
            label="Frontend / Backend"
            value={
              b.summary
                ? `${b.summary.bySource.frontend.toLocaleString()} · ${b.summary.bySource.backend.toLocaleString()}`
                : '—'
            }
            footer="Eventos por origen"
          />
        </div>

        {/* Barra de filtros — componente reusable. Por encima del card. */}
        <FilterBar
          className="shrink-0"
          search={{
            value: b.filters.search,
            onChange: (v) => b.setFilter('search', v),
            placeholder: 'Buscar mensaje, URL o módulo'
          }}
          selects={[
            {
              id: 'level',
              options: LEVEL_OPTS,
              value: currentLevel,
              onChange: (v: LogLevel | null) =>
                b.setFilter('levels', v ? [v] : []),
              placeholder: 'Todos los niveles',
              width: 170
            },
            {
              id: 'source',
              options: SOURCE_OPTS,
              value: currentSource,
              onChange: (v: LogSource | null) =>
                b.setFilter('sources', v ? [v] : []),
              placeholder: 'Todos los orígenes',
              width: 170
            },
            {
              id: 'category',
              options: CATEGORY_OPTS,
              value: currentCategory,
              onChange: (v: LogCategory | null) =>
                b.setFilter('categories', v ? [v] : []),
              placeholder: 'Todas las categorías',
              width: 180
            },
            {
              id: 'auto-refresh',
              options: AUTO_OPTS,
              value: currentAuto,
              onChange: (v: AutoOption | null) =>
                b.setFilter('autoRefreshSec', v ? Number(v) : 0),
              placeholder: 'Sin auto-refresh',
              width: 150
            }
          ]}
        />

        {/* Tabla — el DataTable conserva su toolbar nativo. */}
        <div className="flex min-h-[400px] flex-1 flex-col overflow-hidden rounded-xl bg-bg shadow-sm">
          <DataTable
            data={data}
            columns={columns}
            rowKey={(r) => r._id}
            onRowClick={
              b.loading ? undefined : (_k, r) => void b.selectLog(r)
            }
            initialPageSize={10}
            hideLocalSearch
            emptyMessage={
              b.error ? 'No se pudo cargar la bitácora' : 'No hay eventos registrados'
            }
          />
        </div>
      </div>

      {panelOpen && (
        <div className="flex h-full w-full min-w-0 flex-col overflow-hidden rounded-xl bg-bg shadow-sm md:w-[400px] md:flex-none md:shrink-0 lg:w-[440px]">
          <LogDetailPanel
            detail={b.selected}
            loading={b.selectedLoading}
            onClose={b.closeDetail}
            onSelectRelated={(e) => void b.selectLog(e)}
          />
        </div>
      )}
    </div>
  );
}
