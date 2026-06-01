// Panel de Tests — 100% alto/ancho. 3 vistas:
//   1) Selección: IZQUIERDA = "todos los tests"; DERECHA = "para ejecutar".
//      AMBAS usan el MISMO diseño de carpetas (módulo) colapsables. Se puede
//      arrastrar un TEST suelto o una CARPETA completa (mueve todos sus tests)
//      de una sección a la otra.
//   2) Ejecución: el loader sale en la sección derecha (contador X/N + barra),
//      con la izquierda atenuada como deshabilitada.
//   3) Resultados: resumen + tabla + errores.

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent
} from '@dnd-kit/core';
import Button from '../../../../shared/components/Button/index.js';
import DataTable, {
  type ColumnDef
} from '../../../../shared/components/DataTable/index.js';
import { useToast } from '../../../../shared/components/Toast/index.js';
import { http } from '../../../../shared/utils/http.js';
import { cn } from '../../../../shared/lib/cn.js';
import Skeleton from '../../../../shared/components/Skeleton/index.js';
import ProgressBar from '../../../../shared/components/ProgressBar/index.js';
import {
  PlayIcon,
  CheckIcon,
  XIcon,
  ClockIcon,
  ChevronRightIcon,
  FolderIcon,
  GripIcon
} from '../../../../shared/icons/index.js';

interface FileEntry {
  path: string;
  module: string;
  name: string;
}
interface RunSuite {
  file: string;
  module: string;
  status: string;
  tests: {
    title: string;
    status: string;
    duration: number | null;
    messages: string[];
  }[];
}
interface RunResult {
  summary: {
    total: number;
    passed: number;
    failed: number;
    pending: number;
    suites: number;
  };
  suites: RunSuite[];
}
interface TestRow {
  id: string;
  title: string;
  module: string;
  file: string;
  status: string;
  duration: number | null;
  messages: string[];
}
type Phase = 'select' | 'running' | 'results';
type Zone = 'available' | 'torun';
type DragData =
  | { kind: 'item'; from: Zone; path: string; module: string }
  | { kind: 'folder'; from: Zone; module: string };
type ActiveDrag =
  | { kind: 'item'; label: string }
  | { kind: 'folder'; label: string; count: number }
  | null;

const stripAnsi = (s: string): string => s.replace(/\[[0-9;]*m/g, '');

function statusLabel(status: string): string {
  switch (status) {
    case 'passed':
      return 'Pasó';
    case 'failed':
      return 'Falló';
    case 'pending':
    case 'todo':
      return 'Pendiente';
    default:
      return 'Omitido';
  }
}
function toneFor(status: string): string {
  return status === 'passed'
    ? 'bg-primary-500/12 text-primary-700 dark:text-primary-300'
    : status === 'failed'
      ? 'bg-danger-surface text-danger-text'
      : status === 'pending' || status === 'todo'
        ? 'bg-warning-surface text-warning-text'
        : 'bg-bg-muted text-fg-faint';
}
function StatusBadge({ status }: { status: string }) {
  const Icon =
    status === 'passed' ? CheckIcon : status === 'failed' ? XIcon : ClockIcon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
        toneFor(status)
      )}
    >
      <Icon width={11} height={11} strokeWidth={2.5} />
      {statusLabel(status)}
    </span>
  );
}
function SummaryCard({
  value,
  label,
  tone
}: {
  value: number;
  label: string;
  tone: 'fg' | 'primary' | 'red' | 'amber';
}) {
  const toneCls = {
    fg: 'text-fg',
    primary: 'text-primary',
    red: 'text-danger-text',
    amber: 'text-warning-text'
  }[tone];
  return (
    <div className="rounded-xl bg-bg p-4 shadow-sm">
      <p className={cn('text-[26px] font-bold leading-none tracking-tight', toneCls)}>
        {value}
      </p>
      <p className="mt-1.5 text-[11.5px] font-medium text-fg-muted">{label}</p>
    </div>
  );
}

const columns: ReadonlyArray<ColumnDef<TestRow>> = [
  {
    id: 'status',
    label: 'Estado',
    accessor: (r) => r.status,
    render: (r) => <StatusBadge status={r.status} />,
    filter: 'select',
    filterLabelFor: statusLabel,
    align: 'left',
    width: 120
  },
  {
    id: 'title',
    label: 'Test',
    accessor: (r) => r.title,
    render: (r) => <span className="text-[12.5px] text-fg">{r.title}</span>,
    align: 'left'
  },
  {
    id: 'module',
    label: 'Módulo',
    accessor: (r) => r.module,
    filter: 'select',
    align: 'left',
    width: 150
  },
  {
    id: 'duration',
    label: 'Duración',
    accessor: (r) => (r.duration == null ? -1 : r.duration),
    render: (r) => (r.duration == null ? '—' : `${r.duration} ms`),
    align: 'right',
    width: 110
  }
];

// ── Pieza arrastrable: un TEST suelto ───────────────────────────────────
function Item({ zone, file }: { zone: Zone; file: FileEntry }) {
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, isDragging } =
    useDraggable({
      id: `item:${zone}:${file.path}`,
      data: { kind: 'item', from: zone, path: file.path, module: file.module }
    });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'group flex items-center gap-2 rounded-md bg-bg-muted px-2.5 py-1.5 transition-opacity',
        isDragging && 'opacity-40'
      )}
    >
      {/* El asa (grip) arrastra; el resto de la fila queda libre para
          scroll/tap en táctil. touch-none va SÓLO en el asa. */}
      <span
        ref={setActivatorNodeRef}
        {...listeners}
        {...attributes}
        aria-label={`Arrastrar ${file.name}`}
        className="shrink-0 cursor-grab touch-none rounded p-1 text-fg-faint outline-none group-hover:text-fg-muted active:cursor-grabbing"
      >
        <GripIcon width={11} height={11} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[12px] text-fg">
        {file.name}
      </span>
    </div>
  );
}

// ── Pieza arrastrable: una CARPETA completa (+ toggle para abrir/cerrar) ─
function Folder({
  zone,
  module: mod,
  count,
  isOpen,
  onToggle,
  children
}: {
  zone: Zone;
  module: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, isDragging } =
    useDraggable({
      id: `folder:${zone}:${mod}`,
      data: { kind: 'folder', from: zone, module: mod }
    });
  return (
    <div ref={setNodeRef} className={cn('rounded-md', isDragging && 'opacity-40')}>
      <div className="flex items-center gap-0.5 rounded-md pr-2 transition-colors hover:bg-bg-muted">
        {/* asa: arrastra TODA la carpeta */}
        <span
          ref={setActivatorNodeRef}
          {...listeners}
          {...attributes}
          aria-label={`Arrastrar carpeta ${mod}`}
          className="cursor-grab touch-none rounded p-1.5 text-fg-faint outline-none hover:text-fg-muted active:cursor-grabbing"
        >
          <GripIcon width={12} height={12} />
        </span>
        {/* resto: abre/cierra la carpeta */}
        <button
          type="button"
          onClick={onToggle}
          className="flex min-w-0 flex-1 items-center gap-1.5 py-1.5 text-left outline-none"
        >
          <ChevronRightIcon
            width={11}
            height={11}
            className={cn(
              'shrink-0 text-fg-faint transition-transform',
              isOpen && 'rotate-90'
            )}
          />
          <FolderIcon width={13} height={13} className="shrink-0 text-primary" />
          <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-fg">
            {mod}
          </span>
          <span className="shrink-0 text-[11px] text-fg-faint">{count}</span>
        </button>
      </div>
      {isOpen && (
        <div className="ml-4 mt-0.5 flex flex-col gap-0.5 pb-1">{children}</div>
      )}
    </div>
  );
}

// ── Zona soltable: una sección (izquierda/derecha) ──────────────────────
function Section({
  id,
  children
}: {
  id: Zone;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `section:${id}`,
    data: { section: id }
  });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2 transition-colors',
        isOver && 'bg-bg-muted'
      )}
    >
      {children}
    </div>
  );
}

// ── Lista de carpetas de una sección (agrupa por módulo) ────────────────
function FolderList({
  zone,
  items,
  openSet,
  onToggle
}: {
  zone: Zone;
  items: FileEntry[];
  openSet: Set<string>;
  onToggle: (mod: string) => void;
}) {
  const modules = useMemo(
    () => [...new Set(items.map((i) => i.module))].sort(),
    [items]
  );
  return (
    <>
      {modules.map((mod) => {
        const mods = items.filter((i) => i.module === mod);
        return (
          <Folder
            key={mod}
            zone={zone}
            module={mod}
            count={mods.length}
            isOpen={openSet.has(mod)}
            onToggle={() => onToggle(mod)}
          >
            {mods.map((f) => (
              <Item key={f.path} zone={zone} file={f} />
            ))}
          </Folder>
        );
      })}
    </>
  );
}

export default function TestRunnerPage() {
  const toast = useToast();
  const [phase, setPhase] = useState<Phase>('select');
  const [loadingList, setLoadingList] = useState(true);
  const [available, setAvailable] = useState<FileEntry[]>([]);
  const [torun, setTorun] = useState<FileEntry[]>([]);
  const [openLeft, setOpenLeft] = useState<Set<string>>(new Set());
  const [openRight, setOpenRight] = useState<Set<string>>(new Set());
  const [progress, setProgress] = useState({ done: 0, total: 0, current: '' });
  const [result, setResult] = useState<RunResult | null>(null);
  const [allModules, setAllModules] = useState<string[]>([]);
  const [activeDrag, setActiveDrag] = useState<ActiveDrag>(null);

  // distance:5 → un clic (sin mover) abre/cierra; mover >5px inicia arrastre.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  const fetchList = useCallback(async () => {
    setLoadingList(true);
    try {
      const data = await http<{ files: FileEntry[] }>('/test-runner/list', {
        method: 'POST'
      });
      const files = data?.files ?? [];
      setAvailable(files);
      setTorun([]);
      setAllModules([...new Set(files.map((f) => f.module))].sort());
    } catch (e) {
      toast.error({
        title: 'No se pudo listar los tests',
        message: e instanceof Error ? e.message : 'Inténtalo de nuevo.'
      });
    } finally {
      setLoadingList(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const toggleLeft = (mod: string) =>
    setOpenLeft((prev) => {
      const n = new Set(prev);
      if (n.has(mod)) n.delete(mod);
      else n.add(mod);
      return n;
    });
  const toggleRight = (mod: string) =>
    setOpenRight((prev) => {
      const n = new Set(prev);
      if (n.has(mod)) n.delete(mod);
      else n.add(mod);
      return n;
    });

  // Al soltar algo en una sección, abrimos esa carpeta destino para verlo.
  const openIn = (zone: Zone, mod: string) => {
    const setter = zone === 'torun' ? setOpenRight : setOpenLeft;
    setter((prev) => (prev.has(mod) ? prev : new Set(prev).add(mod)));
  };

  const moveItem = (path: string, from: Zone, to: Zone) => {
    if (from === to) return;
    const src = from === 'available' ? available : torun;
    const f = src.find((x) => x.path === path);
    if (!f) return;
    if (from === 'available') {
      setAvailable((a) => a.filter((x) => x.path !== path));
      setTorun((t) => (t.some((x) => x.path === path) ? t : [...t, f]));
    } else {
      setTorun((t) => t.filter((x) => x.path !== path));
      setAvailable((a) => (a.some((x) => x.path === path) ? a : [...a, f]));
    }
    openIn(to, f.module);
  };

  const moveFolder = (mod: string, from: Zone, to: Zone) => {
    if (from === to) return;
    const src = from === 'available' ? available : torun;
    const moving = src.filter((x) => x.module === mod);
    if (moving.length === 0) return;
    if (from === 'available') {
      setAvailable((a) => a.filter((x) => x.module !== mod));
      setTorun((t) => [
        ...t,
        ...moving.filter((m) => !t.some((x) => x.path === m.path))
      ]);
    } else {
      setTorun((t) => t.filter((x) => x.module !== mod));
      setAvailable((a) => [
        ...a,
        ...moving.filter((m) => !a.some((x) => x.path === m.path))
      ]);
    }
    openIn(to, mod);
  };

  const addAll = () => {
    setTorun((t) => [
      ...t,
      ...available.filter((m) => !t.some((x) => x.path === m.path))
    ]);
    setAvailable([]);
  };
  const clearTorun = () => {
    setAvailable((a) => [
      ...a,
      ...torun.filter((m) => !a.some((x) => x.path === m.path))
    ]);
    setTorun([]);
  };

  const onDragStart = (e: DragStartEvent) => {
    const a = e.active.data.current as DragData | undefined;
    if (!a) return;
    if (a.kind === 'item') {
      const f = (a.from === 'available' ? available : torun).find(
        (x) => x.path === a.path
      );
      setActiveDrag({ kind: 'item', label: f?.name ?? '' });
    } else {
      const count = (a.from === 'available' ? available : torun).filter(
        (x) => x.module === a.module
      ).length;
      setActiveDrag({ kind: 'folder', label: a.module, count });
    }
  };
  const onDragEnd = (e: DragEndEvent) => {
    setActiveDrag(null);
    const a = e.active.data.current as DragData | undefined;
    const over = e.over?.data.current as { section?: Zone } | undefined;
    if (!a || !over?.section) return;
    if (a.kind === 'item') moveItem(a.path, a.from, over.section);
    else moveFolder(a.module, a.from, over.section);
  };
  const onDragCancel = () => setActiveDrag(null);

  const startRun = async () => {
    if (torun.length === 0) return;
    const list = [...torun];
    setProgress({ done: 0, total: list.length, current: list[0]?.name ?? '' });
    setPhase('running');

    const allSuites: RunSuite[] = [];
    const totals = { total: 0, passed: 0, failed: 0, pending: 0, suites: 0 };

    for (let i = 0; i < list.length; i++) {
      setProgress({ done: i, total: list.length, current: list[i].name });
      try {
        const data = await http<RunResult>('/test-runner/run', {
          method: 'POST',
          body: { paths: [list[i].path] }
        });
        if (data) {
          allSuites.push(...data.suites);
          totals.total += data.summary.total;
          totals.passed += data.summary.passed;
          totals.failed += data.summary.failed;
          totals.pending += data.summary.pending;
          totals.suites += data.summary.suites;
        }
      } catch {
        /* el archivo que falló al correr se ignora en el acumulado */
      }
    }

    setProgress({ done: list.length, total: list.length, current: '' });
    setResult({ summary: totals, suites: allSuites });
    if (totals.failed > 0) {
      toast.error({
        title: 'Pruebas con fallos',
        message: `${totals.failed} de ${totals.total} fallaron.`
      });
    } else {
      toast.success({
        title: 'Pruebas ejecutadas',
        message: `${totals.passed} pasaron${totals.pending ? `, ${totals.pending} pendientes` : ''}.`
      });
    }
    setPhase('results');
  };

  const rows = useMemo<TestRow[]>(
    () =>
      (result?.suites ?? []).flatMap((s, si) =>
        s.tests.map((t, ti) => ({
          id: `${si}-${ti}`,
          title: t.title,
          module: s.module,
          file: s.file,
          status: t.status,
          duration: t.duration,
          messages: t.messages
        }))
      ),
    [result]
  );
  const failures = rows.filter((r) => r.status === 'failed');

  // ── Vista: SELECCIÓN / EJECUCIÓN ────────────────────────────────────
  if (phase === 'select' || phase === 'running') {
    const running = phase === 'running';
    const pct = progress.total ? (progress.done / progress.total) * 100 : 0;
    return (
      <div className="flex h-full w-full flex-col gap-3 bg-page p-4 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold tracking-tight text-fg">
              Pruebas del proyecto
            </h2>
            <p className="text-[12px] text-fg-muted">
              Arrastra un test —o una carpeta completa— a la derecha para
              ejecutarlo.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<PlayIcon width={13} height={13} strokeWidth={2.5} />}
            onClick={startRun}
            disabled={running || torun.length === 0}
          >
            {running ? 'Ejecutando…' : `Ejecutar (${torun.length})`}
          </Button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
          onDragCancel={onDragCancel}
        >
          <div className="grid min-h-0 flex-1 grid-rows-2 gap-4 lg:grid-cols-2 lg:grid-rows-1">
            {/* IZQUIERDA: todos los tests (carpetas). Se atenúa al ejecutar. */}
            <div
              className={cn(
                'flex min-h-0 flex-col overflow-hidden rounded-xl bg-bg shadow-sm transition-opacity',
                running && 'pointer-events-none opacity-50'
              )}
            >
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-subtle px-4 py-2.5">
                <h3 className="text-[12px] font-semibold uppercase tracking-wider text-fg-faint">
                  Todos los tests
                </h3>
                {!loadingList && available.length > 0 && (
                  <button
                    type="button"
                    onClick={addAll}
                    className="text-[11px] font-medium text-primary outline-none hover:underline"
                  >
                    Agregar todas →
                  </button>
                )}
              </div>
              <Section id="available">
                {loadingList ? (
                  Array.from({ length: 6 }, (_, i) => (
                    <div key={i} className="flex items-center gap-2 px-2 py-2">
                      <Skeleton variant="rect" width={12} height={12} />
                      <Skeleton
                        variant="text"
                        width={`${40 + ((i * 17) % 40)}%`}
                        height={11}
                      />
                    </div>
                  ))
                ) : allModules.length === 0 ? (
                  <p className="px-2 py-6 text-center text-[12px] text-fg-faint">
                    No se encontraron tests.
                  </p>
                ) : available.length === 0 ? (
                  <p className="px-2 py-6 text-center text-[12px] text-fg-faint">
                    Todas las carpetas están en ejecutar.
                  </p>
                ) : (
                  <FolderList
                    zone="available"
                    items={available}
                    openSet={openLeft}
                    onToggle={toggleLeft}
                  />
                )}
              </Section>
            </div>

            {/* DERECHA: para ejecutar (carpetas) — o el LOADER de ejecución. */}
            <div className="flex min-h-0 flex-col overflow-hidden rounded-xl bg-bg shadow-sm">
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border-subtle px-4 py-2.5">
                <h3 className="text-[12px] font-semibold uppercase tracking-wider text-fg-faint">
                  {running ? 'Ejecutando…' : `Para ejecutar (${torun.length})`}
                </h3>
                {!running && torun.length > 0 && (
                  <button
                    type="button"
                    onClick={clearTorun}
                    className="text-[11px] font-medium text-fg-muted outline-none hover:text-danger-text"
                  >
                    Limpiar
                  </button>
                )}
              </div>
              {running ? (
                <div className="flex min-h-0 flex-1 flex-col justify-center gap-2.5 p-6">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-[12px] font-medium text-fg-muted">
                      Ejecutando pruebas…
                    </span>
                    <span className="text-[13px] font-semibold tabular-nums text-fg">
                      {progress.done}
                      <span className="text-fg-faint"> / {progress.total}</span>
                    </span>
                  </div>
                  <ProgressBar value={pct} variant="primary" size="md" />
                  <p className="h-4 truncate text-[11.5px] text-fg-faint">
                    {progress.current}
                  </p>
                </div>
              ) : (
                <Section id="torun">
                  {torun.length === 0 ? (
                    <p className="px-3 py-8 text-center text-[12px] text-fg-faint">
                      Arrastra tests o carpetas aquí desde la izquierda.
                    </p>
                  ) : (
                    <FolderList
                      zone="torun"
                      items={torun}
                      openSet={openRight}
                      onToggle={toggleRight}
                    />
                  )}
                </Section>
              )}
            </div>
          </div>

          <DragOverlay dropAnimation={null}>
            {activeDrag ? (
              activeDrag.kind === 'folder' ? (
                <div className="flex items-center gap-1.5 rounded-md bg-bg px-2.5 py-1.5 shadow-lg">
                  <FolderIcon width={13} height={13} className="text-primary" />
                  <span className="text-[12px] font-medium text-fg">
                    {activeDrag.label}
                  </span>
                  <span className="rounded-full bg-bg-muted px-1.5 text-[10px] font-semibold text-fg-muted">
                    {activeDrag.count}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-md bg-bg px-2.5 py-1.5 shadow-lg">
                  <GripIcon width={11} height={11} className="text-fg-faint" />
                  <span className="text-[12px] text-fg">{activeDrag.label}</span>
                </div>
              )
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    );
  }

  // ── Vista: RESULTADOS ───────────────────────────────────────────────
  return (
    <div className="flex h-full w-full flex-col gap-4 bg-page p-4 lg:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-[15px] font-semibold tracking-tight text-fg">Resultados</h2>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ChevronRightIcon width={13} height={13} className="rotate-180" />}
          onClick={() => setPhase('select')}
        >
          Volver a seleccionar
        </Button>
      </div>

      {result && (
        <>
          <div className="grid shrink-0 grid-cols-2 gap-3 sm:grid-cols-4">
            <SummaryCard value={result.summary.total} label="Total" tone="fg" />
            <SummaryCard value={result.summary.passed} label="Pasaron" tone="primary" />
            <SummaryCard value={result.summary.failed} label="Fallaron" tone="red" />
            <SummaryCard value={result.summary.pending} label="Pendientes" tone="amber" />
          </div>

          {failures.length > 0 && (
            <div className="max-h-[24vh] shrink-0 overflow-y-auto rounded-xl bg-bg p-4 shadow-sm">
              <h3 className="mb-3 flex items-center gap-2 text-[13px] font-semibold text-fg">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-danger-surface text-danger-text">
                  <XIcon width={12} height={12} strokeWidth={2.5} />
                </span>
                Errores ({failures.length})
              </h3>
              <div className="space-y-3">
                {failures.map((f) => (
                  <div key={f.id} className="rounded-lg bg-danger-surface p-3">
                    <p className="text-[12.5px] font-semibold text-fg">{f.title}</p>
                    <p className="mb-2 text-[11px] text-fg-faint">
                      {f.module} · {f.file}
                    </p>
                    <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-md bg-bg-muted p-2.5 text-[11px] leading-relaxed text-fg-muted">
                      {f.messages.map(stripAnsi).join('\n\n') || 'Sin detalle.'}
                    </pre>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="min-h-0 flex-1 overflow-hidden rounded-xl bg-bg shadow-sm">
            <DataTable
              data={rows}
              columns={columns}
              initialPageSize={15}
              searchPlaceholder="Buscar test"
              emptyMessage="No se encontraron tests."
            />
          </div>
        </>
      )}
    </div>
  );
}
