// Tester de Google Sheets — un solo panel ancho con tabs (Hoja /
// Pestañas / Datos) en la top bar.  Sin aside izquierdo (las acciones
// viven en la top bar).  Cada tab ocupa el 100% del alto y ancho.
//
// Insertar datos: textarea para pegar desde Excel/Sheets (TSV) en vez
// de la mini-grilla editable — más rápido y cómodo.

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import Alert from '../../../../shared/components/Alert/index.js';
import Button from '../../../../shared/components/Button/index.js';
import EmptyState from '../../../../shared/components/EmptyState/index.js';
import FilterBar from '../../../../shared/components/FilterBar/index.js';
import Input from '../../../../shared/components/Input/index.js';
import Select from '../../../../shared/components/Select/index.js';
import { useToast } from '../../../../shared/components/Toast/index.js';
import {
  ChevronLeftIcon,
  DatabaseIcon,
  ExternalLinkIcon,
  PlusIcon,
  TrashIcon
} from '../../../../shared/icons/index.js';
import Tooltip from '../../../../shared/components/Tooltip/index.js';
import { cn } from '../../../../shared/lib/cn.js';
import GoogleConnectionPanel from '../../../google-connection/ui/components/GoogleConnectionPanel.js';
import { googleSheetsHttp } from '../../adapters/exit/google-sheets.http.adapter.js';
import type {
  CellValue,
  SheetMeta,
  SpreadsheetMeta,
  SpreadsheetSummary,
  ValueMatrix
} from '../../domain/google-sheets.types.js';

// ── helpers ──────────────────────────────────────────────────────

function timeAgo(iso: string | null): string {
  if (!iso) return '';
  const ms = Date.parse(iso);
  if (!Number.isFinite(ms)) return '';
  const diff = Math.max(0, Date.now() - ms);
  if (diff < 60_000) return 'hace un instante';
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 30) return `hace ${d} d`;
  return new Date(ms).toLocaleDateString('es-CO');
}

function parseCellRef(ref: string): { row: number; col: number } | null {
  const m = ref.trim().toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!m) return null;
  let col = 0;
  for (const ch of m[1]) col = col * 26 + (ch.charCodeAt(0) - 64);
  const row = parseInt(m[2], 10);
  if (!Number.isFinite(row) || row < 1) return null;
  return { row, col };
}

function parseRangeDims(from: string, to: string): { rows: number; cols: number } {
  const a = parseCellRef(from);
  const b = parseCellRef(to);
  if (!a || !b) return { rows: 1, cols: 1 };
  return {
    rows: Math.max(1, Math.abs(b.row - a.row) + 1),
    cols: Math.max(1, Math.abs(b.col - a.col) + 1)
  };
}

function colIdxToLetter(n: number): string {
  let s = '';
  let k = Math.max(1, n);
  while (k > 0) {
    const r = (k - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    k = Math.floor((k - 1) / 26);
  }
  return s;
}

function parseCell(s: string): CellValue {
  const t = s.trim();
  if (t === '') return null;
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
  return s;
}

// Parsea pegado desde Excel / Sheets: TAB-separated por columna, salto
// de línea por fila. Acepta también CSV simple (coma) si no detecta TAB.
function parsePastedMatrix(raw: string): ValueMatrix {
  const text = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  if (!text.trim()) return [];
  const lines = text.split('\n');
  // Si hay al menos un TAB en alguna línea, separamos por TAB; sino por coma.
  const hasTab = lines.some((l) => l.includes('\t'));
  const splitter = hasTab ? /\t/ : /,/;
  return lines
    .filter((l) => l.length > 0)
    .map((l) => l.split(splitter).map((c) => parseCell(c)));
}

// ── Página ───────────────────────────────────────────────────────

type SortKey = 'recent' | 'oldest' | 'az' | 'za';
type ActionTab = 'sheet' | 'data';

export default function GoogleSheetsListPage() {
  const [connected, setConnected] = useState<boolean | null>(null);
  if (connected !== true) {
    return (
      <div className="flex h-full overflow-hidden p-3 sm:p-4 lg:p-6">
        <div className="flex h-full min-w-0 flex-1 items-center justify-center rounded-xl bg-bg shadow-sm">
          <GoogleConnectionPanel variant="empty" onChange={setConnected} />
        </div>
      </div>
    );
  }
  return <Shell onDisconnected={() => setConnected(false)} />;
}

function Shell({ onDisconnected }: { onDisconnected: () => void }) {
  const toast = useToast();
  const [items, setItems] = useState<SpreadsheetSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  const refresh = useCallback(async (): Promise<void> => {
    setLoadingList(true);
    try {
      setItems(await googleSheetsHttp.listSpreadsheets());
    } catch (e) {
      toast.error({
        title: 'No se pudieron cargar tus hojas',
        message: e instanceof Error ? e.message : ''
      });
    } finally {
      setLoadingList(false);
    }
  }, [toast]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const handleCreated = useCallback(
    async (id: string | null): Promise<void> => {
      await refresh();
      if (id) setOpenId(id);
    },
    [refresh]
  );

  return (
    <div className="flex h-full flex-col overflow-hidden p-3 sm:p-4 lg:p-6">
      <div className="hidden">
        <GoogleConnectionPanel variant="inline" onChange={(c) => !c && onDisconnected()} />
      </div>
      {openId ? (
        <Detail
          spreadsheetId={openId}
          summary={items.find((i) => i.id === openId) ?? null}
          allItems={items}
          onSwitch={setOpenId}
          onBack={() => {
            setOpenId(null);
            void refresh();
          }}
          onSpreadsheetDeleted={async () => {
            setOpenId(null);
            await refresh();
          }}
          onMutate={refresh}
        />
      ) : (
        <ListView
          items={items}
          loading={loadingList}
          onPick={setOpenId}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// LISTA
// ────────────────────────────────────────────────────────────────

function ListView({
  items,
  loading,
  onPick,
  onCreated
}: {
  items: SpreadsheetSummary[];
  loading: boolean;
  onPick: (id: string) => void;
  onCreated: (id: string | null) => Promise<void>;
}) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('recent');
  // pageSize auto-calculado: fila CreateRow + N filas de hoja, cada una
  // de 60px (py-3 + contenido) + 8px gap.
  const listContainerRef = useRef<HTMLDivElement | null>(null);
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const el = listContainerRef.current;
    if (!el) return;
    const calc = (): void => {
      const h = el.clientHeight;
      const ROW = 60;
      const GAP = 8;
      // Restamos la fila Crear (60) + 1 gap.
      const usable = Math.max(0, h - ROW - GAP);
      // Cada fila ocupa ROW + GAP (la última no necesita gap, pero
      // sumamos uno extra para no quedar borde con borde — total
      // (n-1)*GAP. Aproximación: floor((usable + GAP) / (ROW + GAP)).
      const fit = Math.max(1, Math.floor((usable + GAP) / (ROW + GAP)));
      setPageSize(fit);
    };
    calc();
    const obs = new ResizeObserver(calc);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? items.filter((p) => p.name.toLowerCase().includes(q)) : items;
    const cmp = (a: SpreadsheetSummary, b: SpreadsheetSummary): number => {
      switch (sort) {
        case 'recent':
          return (b.modifiedAt ?? '').localeCompare(a.modifiedAt ?? '');
        case 'oldest':
          return (a.modifiedAt ?? '').localeCompare(b.modifiedAt ?? '');
        case 'az':
          return a.name.localeCompare(b.name);
        case 'za':
          return b.name.localeCompare(a.name);
      }
    };
    return [...list].sort(cmp);
  }, [items, query, sort]);

  useEffect(() => {
    setPage(0);
  }, [query, sort, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const slice = filtered.slice(safePage * pageSize, (safePage + 1) * pageSize);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <FilterBar
        className="shrink-0"
        search={{
          value: query,
          onChange: setQuery,
          placeholder: 'Buscar tus hojas por nombre'
        }}
        selects={[
          {
            id: 'sort',
            value: sort,
            onChange: (v) => v && setSort(v as SortKey),
            options: [
              { value: 'recent', label: 'Más recientes' },
              { value: 'oldest', label: 'Más antiguas' },
              { value: 'az', label: 'A → Z' },
              { value: 'za', label: 'Z → A' }
            ],
            width: 170
          }
        ]}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div ref={listContainerRef} className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
          <CreateRow onCreated={onCreated} />
          {loading ? null : slice.length === 0 && items.length > 0 ? (
            <p className="px-5 py-6 text-center text-[12px] text-fg-faint">
              Ninguna coincide con el buscador.
            </p>
          ) : items.length === 0 ? (
            <div className="rounded-xl bg-bg p-6 shadow-sm">
              <EmptyState
                icon={<DatabaseIcon width={22} height={22} />}
                title="No tenés hojas"
                description="Creá una con la fila de arriba."
              />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
              {slice.map((p) => (
                <SpreadsheetRow key={p.id} item={p} onClick={() => onPick(p.id)} />
              ))}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <SlimPagination
            page={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        )}
      </div>
    </div>
  );
}

function SlimPagination({
  page,
  totalPages,
  onPageChange
}: {
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="mt-2 flex shrink-0 items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => onPageChange(Math.max(0, page - 1))}
        disabled={page === 0}
        className="inline-flex h-8 items-center rounded-md px-3 text-[12px] font-medium text-fg-muted outline-none transition-colors duration-200 hover:bg-bg-muted disabled:opacity-40"
      >
        Anterior
      </button>
      <span className="text-[11.5px] text-fg-faint">
        Página {page + 1} de {totalPages}
      </span>
      <button
        type="button"
        onClick={() => onPageChange(Math.min(totalPages - 1, page + 1))}
        disabled={page >= totalPages - 1}
        className="inline-flex h-8 items-center rounded-md px-3 text-[12px] font-medium text-fg-muted outline-none transition-colors duration-200 hover:bg-bg-muted disabled:opacity-40"
      >
        Siguiente
      </button>
    </div>
  );
}

function CreateRow({
  onCreated
}: {
  onCreated: (id: string | null) => Promise<void>;
}) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [running, setRunning] = useState(false);

  const handleCreate = async (): Promise<void> => {
    const t = name.trim();
    if (!t || running) return;
    setRunning(true);
    try {
      const m = await googleSheetsHttp.createSpreadsheet(t);
      toast.success({ title: 'Hoja creada', message: m?.title ?? t });
      setName('');
      setOpen(false);
      await onCreated(m?.id ?? null);
    } catch (e) {
      toast.error({
        title: 'No se pudo crear',
        message: e instanceof Error ? e.message : ''
      });
    } finally {
      setRunning(false);
    }
  };

  if (open) {
    return (
      <div className="mb-3 flex w-full shrink-0 items-center gap-2 rounded-xl border-2 border-dashed border-primary bg-bg px-5 py-3 shadow-sm">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-dashed border-primary text-primary">
          <PlusIcon width={15} height={15} />
        </span>
        <div className="min-w-0 flex-1">
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleCreate();
              if (e.key === 'Escape') {
                setName('');
                setOpen(false);
              }
            }}
            placeholder="Nombre de la nueva hoja"
          />
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={!name.trim() || running}
          onClick={() => void handleCreate()}
        >
          {running ? 'Creando…' : 'Crear'}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={running}
          onClick={() => {
            setName('');
            setOpen(false);
          }}
        >
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="group mb-3 flex w-full shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border bg-bg-muted/20 px-5 py-4 text-center outline-none transition-colors duration-200 hover:border-primary hover:bg-primary-50 dark:hover:bg-primary-500/10"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border-2 border-dashed border-fg-faint text-fg-faint transition-colors duration-200 group-hover:border-primary group-hover:text-primary">
        <PlusIcon width={15} height={15} />
      </span>
      <span className="text-[13px] font-semibold text-fg-muted transition-colors duration-200 group-hover:text-primary">
        Crear nueva hoja
      </span>
    </button>
  );
}

function SpreadsheetRow({
  item,
  onClick
}: {
  item: SpreadsheetSummary;
  onClick: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="flex w-full shrink-0 cursor-pointer items-center gap-3 rounded-xl bg-bg px-5 py-3 shadow-sm outline-none transition-colors duration-200 hover:bg-primary-50 dark:hover:bg-primary-500/10"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary dark:bg-primary-500/15">
        <DatabaseIcon width={15} height={15} />
      </span>
      <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-fg">
        {item.name}
      </span>
      <span className="shrink-0 text-[11px] text-fg-faint">
        {timeAgo(item.modifiedAt)}
      </span>
      {item.webViewLink && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.open(item.webViewLink ?? '', '_blank', 'noopener,noreferrer');
          }}
          title="Abrir en Google Sheets"
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-fg-faint outline-none transition-colors duration-200 hover:bg-primary/15 hover:text-primary"
        >
          <ExternalLinkIcon width={13} height={13} />
        </button>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// DETALLE — top bar con acciones, panel UNICO debajo
// ────────────────────────────────────────────────────────────────

function Detail({
  spreadsheetId,
  summary,
  allItems,
  onSwitch,
  onBack,
  onSpreadsheetDeleted,
  onMutate
}: {
  spreadsheetId: string;
  summary: SpreadsheetSummary | null;
  allItems: SpreadsheetSummary[];
  onSwitch: (id: string) => void;
  onBack: () => void;
  onSpreadsheetDeleted: () => Promise<void>;
  onMutate: () => Promise<void>;
}) {
  const toast = useToast();
  const [meta, setMeta] = useState<SpreadsheetMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheetId, setSheetId] = useState<number | null>(null);
  const [tab, setTab] = useState<ActionTab>('sheet');

  const loadMeta = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const m = await googleSheetsHttp.getSpreadsheet(spreadsheetId);
      setMeta(m);
      if (m && m.sheets.length > 0) {
        setSheetId((cur) =>
          cur != null && m.sheets.some((s) => s.sheetId === cur) ? cur : m.sheets[0].sheetId
        );
      } else {
        setSheetId(null);
      }
    } catch (e) {
      toast.error({
        title: 'No se pudo abrir la hoja',
        message: e instanceof Error ? e.message : ''
      });
    } finally {
      setLoading(false);
    }
  }, [spreadsheetId, toast]);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  const reloadAll = useCallback(async (): Promise<void> => {
    await loadMeta();
    await onMutate();
  }, [loadMeta, onMutate]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      {/* Top bar: back + pickers + tabs de acciones + crear */}
      <div className="flex shrink-0 flex-wrap items-center gap-3 rounded-xl bg-bg px-4 py-3 shadow-sm">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-[12px] font-medium text-fg-muted outline-none transition-colors hover:bg-bg-muted hover:text-fg"
        >
          <ChevronLeftIcon width={13} height={13} />
          Mis hojas
        </button>
        <div className="h-5 w-px bg-border-subtle" aria-hidden="true" />
        <div className="min-w-[200px] max-w-xs flex-1">
          <Select<string>
            options={allItems.map((s) => ({ value: s.id, label: s.name }))}
            value={spreadsheetId}
            onChange={(v) => v && onSwitch(v)}
            searchable
            placeholder="Hoja de cálculo"
          />
        </div>
        <div className="min-w-[150px] max-w-[200px] flex-1">
          <Select<number>
            options={(meta?.sheets ?? []).map((s) => ({ value: s.sheetId, label: s.title }))}
            value={sheetId}
            onChange={(v) => setSheetId(v ?? null)}
            searchable
            placeholder={loading ? 'Cargando…' : 'Pestaña'}
            disabled={loading || !meta || meta.sheets.length === 0}
          />
        </div>

        <div className="h-5 w-px bg-border-subtle" aria-hidden="true" />

        {/* Acciones inline (las que antes estaban en el aside izquierdo) */}
        <div className="flex flex-wrap gap-1">
          {(['sheet', 'data'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cn(
                'h-8 rounded-md px-3 text-[12px] font-medium outline-none transition-colors',
                tab === t
                  ? 'bg-primary text-on-primary shadow-sm'
                  : 'bg-bg-muted text-fg-muted hover:bg-bg-muted/70 hover:text-fg'
              )}
            >
              {t === 'sheet' ? 'Hoja' : 'Datos'}
            </button>
          ))}
        </div>

        <div className="ml-auto">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={!meta?.url}
            onClick={() => meta?.url && window.open(meta.url, '_blank', 'noopener,noreferrer')}
          >
            Abrir en Google
          </Button>
        </div>
      </div>

      {/* Cuerpo: cada tab maneja sus propios contenedores */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {loading || !meta ? (
          <div className="flex flex-1 items-center justify-center text-[12px] text-fg-faint">
            {loading ? 'Cargando hoja…' : 'No se pudo cargar'}
          </div>
        ) : tab === 'sheet' ? (
          <SheetTab
            key={meta.id}
            meta={meta}
            summary={summary}
            onMutate={reloadAll}
            onDeleted={onSpreadsheetDeleted}
          />
        ) : (
          <DataTab
            key={`${meta.id}:${sheetId ?? '_'}`}
            meta={meta}
            sheetId={sheetId}
            onSheetChange={setSheetId}
          />
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// TAB 1: HOJA — info de la hoja, renombrar, eliminar
// ────────────────────────────────────────────────────────────────

function SheetTab({
  meta,
  summary,
  onMutate,
  onDeleted
}: {
  meta: SpreadsheetMeta;
  summary: SpreadsheetSummary | null;
  onMutate: () => Promise<void>;
  onDeleted: () => Promise<void>;
}) {
  const toast = useToast();
  const [name, setName] = useState(meta.title);
  const [renaming, setRenaming] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const totalCells = meta.sheets.reduce(
    (acc, s) => acc + s.rowCount * s.columnCount,
    0
  );
  const totalRows = meta.sheets.reduce((acc, s) => acc + s.rowCount, 0);
  const totalCols = meta.sheets.reduce((acc, s) => acc + s.columnCount, 0);
  const fmt = (n: number): string => n.toLocaleString('es-CO');

  const handleRename = async (): Promise<void> => {
    if (renaming || !name.trim() || name.trim() === meta.title) return;
    setRenaming(true);
    try {
      await googleSheetsHttp.renameSpreadsheet(meta.id, name.trim());
      toast.success({ title: 'Hoja renombrada', message: name.trim() });
      await onMutate();
    } catch (e) {
      toast.error({
        title: 'No se pudo renombrar',
        message: e instanceof Error ? e.message : ''
      });
    } finally {
      setRenaming(false);
    }
  };

  return (
    <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-hidden lg:grid-cols-2">
      {/* IZQ — Hoja: info (1 fila cada cosita) + renombrar + eliminar */}
      <div className="flex min-h-0 flex-col gap-1.5 overflow-y-auto rounded-xl bg-bg p-4 shadow-sm">
        <p className="shrink-0 pb-1 text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
          Hoja
        </p>
        <InfoRow label="Nombre" value={meta.title} />
        <InfoRow label="ID" value={meta.id} mono />
        <InfoRow label="Pestañas" value={fmt(meta.sheets.length)} />
        <InfoRow
          label="Celdas"
          value={`${fmt(totalCells)} (${fmt(totalRows)} filas · ${fmt(totalCols)} columnas)`}
        />
        <InfoRow label="Zona horaria" value={meta.timeZone ?? '—'} />
        <InfoRow label="Idioma" value={meta.locale ?? '—'} />
        <InfoRow
          label="Modificada"
          value={summary?.modifiedAt ? timeAgo(summary.modifiedAt) : '—'}
        />
        <InfoRow
          label="URL"
          value={
            meta.url ? (
              <a
                href={meta.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                Abrir en Google Sheets
                <ExternalLinkIcon width={11} height={11} />
              </a>
            ) : (
              '—'
            )
          }
        />
        {/* Renombrar — fila idéntica visualmente a InfoRow, input transparente */}
        <div className="flex items-center gap-2 rounded-lg bg-bg-muted/30 px-3 py-2 transition-colors duration-200 focus-within:bg-bg-muted/60">
          <span className="w-24 shrink-0 text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
            Renombrar
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleRename();
            }}
            className="min-w-0 flex-1 bg-transparent text-[12.5px] text-fg outline-none placeholder:text-fg-faint"
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={renaming || !name.trim() || name.trim() === meta.title}
            onClick={() => void handleRename()}
          >
            {renaming ? 'Renombrando…' : 'Renombrar'}
          </Button>
        </div>
        <div className="mt-auto flex items-center gap-2 rounded-lg bg-danger-surface/30 px-3 py-2">
          <span className="w-24 shrink-0 text-[10.5px] font-semibold uppercase tracking-wider text-danger-text">
            Eliminar
          </span>
          <span className="min-w-0 flex-1 truncate text-[11.5px] text-fg-muted">
            Borra <b>{meta.title}</b> del Drive. No se deshace.
          </span>
          <Button
            type="button"
            variant="outline-danger"
            size="sm"
            onClick={() => setConfirmDel(true)}
          >
            Eliminar
          </Button>
        </div>
      </div>

      {/* DER — Pestañas: gestor completo (agregar/renombrar inline/duplicar/eliminar) */}
      <PestanasManagerInline meta={meta} onMutate={onMutate} />

      {confirmDel && (
        <Alert
          type="confirm"
          title="¿Eliminar esta hoja?"
          message={`Se borra "${meta.title}" de tu Drive. No se puede deshacer.`}
          confirmText="ELIMINAR"
          cancelText="CANCELAR"
          onCancel={() => setConfirmDel(false)}
          onClose={() => setConfirmDel(false)}
          onConfirm={async () => {
            setConfirmDel(false);
            try {
              await googleSheetsHttp.deleteSpreadsheet(meta.id);
              toast.success({ title: 'Hoja eliminada', message: meta.title });
              await onDeleted();
            } catch (e) {
              toast.error({
                title: 'No se pudo eliminar',
                message: e instanceof Error ? e.message : ''
              });
            }
          }}
        />
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-bg-muted/30 px-3 py-2">
      <span className="w-24 shrink-0 text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
        {label}
      </span>
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-[12.5px] text-fg',
          mono && 'font-mono text-[11px]'
        )}
      >
        {value}
      </span>
    </div>
  );
}

function PestanasManagerInline({
  meta,
  onMutate
}: {
  meta: SpreadsheetMeta;
  onMutate: () => Promise<void>;
}) {
  const toast = useToast();
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [pendingDelete, setPendingDelete] = useState<SheetMeta | null>(null);

  const handleAdd = async (): Promise<void> => {
    const t = newName.trim();
    if (!t || adding) return;
    setAdding(true);
    try {
      await googleSheetsHttp.addSheet(meta.id, t);
      toast.success({ title: 'Pestaña agregada', message: t });
      setNewName('');
      await onMutate();
    } catch (e) {
      toast.error({
        title: 'No se pudo agregar',
        message: e instanceof Error ? e.message : ''
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-col gap-1.5 overflow-hidden rounded-xl bg-bg p-4 shadow-sm">
      <div className="flex shrink-0 items-center justify-between gap-2 pb-1">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
          Pestañas ({meta.sheets.length})
        </p>
      </div>

      {/* Agregar — fila idéntica a las otras, input transparente */}
      <div className="flex shrink-0 items-center gap-2 rounded-lg bg-bg-muted/30 px-3 py-2 transition-colors duration-200 focus-within:bg-bg-muted/60">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
          <PlusIcon width={12} height={12} />
        </span>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') void handleAdd();
          }}
          placeholder="Nombre de la nueva pestaña"
          className="min-w-0 flex-1 bg-transparent text-[12.5px] text-fg outline-none placeholder:text-fg-faint"
        />
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={!newName.trim() || adding}
          onClick={() => void handleAdd()}
        >
          {adding ? 'Agregando…' : 'Agregar'}
        </Button>
      </div>

      <ul className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
        {meta.sheets.map((s) => (
          <li
            key={s.sheetId}
            className="flex items-center gap-2 rounded-lg bg-bg-muted/40 px-3 py-2 transition-colors duration-200 hover:bg-bg-muted/70 focus-within:bg-bg-muted/70"
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-[10.5px] font-bold text-primary">
              {s.title[0]?.toUpperCase() ?? '·'}
            </span>
            {editing === s.sheetId ? (
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={async () => {
                  const next = editName.trim();
                  setEditing(null);
                  if (next && next !== s.title) {
                    try {
                      await googleSheetsHttp.renameSheet(meta.id, s.sheetId, next);
                      toast.success({ title: 'Pestaña renombrada', message: next });
                      await onMutate();
                    } catch (e) {
                      toast.error({
                        title: 'No se pudo renombrar',
                        message: e instanceof Error ? e.message : ''
                      });
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                  if (e.key === 'Escape') setEditing(null);
                }}
                autoFocus
                className="min-w-0 flex-1 bg-transparent text-[12.5px] font-semibold text-fg outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditing(s.sheetId);
                  setEditName(s.title);
                }}
                title="Click para renombrar"
                className="min-w-0 flex-1 truncate rounded text-left text-[12.5px] font-semibold text-fg outline-none"
              >
                {s.title}
              </button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={async () => {
                try {
                  const r = await googleSheetsHttp.duplicateSheet(meta.id, s.sheetId);
                  toast.success({
                    title: 'Pestaña duplicada',
                    message: r?.title ?? s.title
                  });
                  await onMutate();
                } catch (e) {
                  toast.error({
                    title: 'No se pudo duplicar',
                    message: e instanceof Error ? e.message : ''
                  });
                }
              }}
            >
              Duplicar
            </Button>
            <button
              type="button"
              onClick={() => setPendingDelete(s)}
              title="Eliminar pestaña"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-fg-faint outline-none transition-colors duration-200 hover:bg-danger-surface hover:text-danger-text"
            >
              <TrashIcon width={12} height={12} />
            </button>
          </li>
        ))}
      </ul>

      {pendingDelete && (
        <Alert
          type="confirm"
          title="¿Eliminar esta pestaña?"
          message={`Se borra "${pendingDelete.title}".`}
          confirmText="ELIMINAR"
          cancelText="CANCELAR"
          onCancel={() => setPendingDelete(null)}
          onClose={() => setPendingDelete(null)}
          onConfirm={async () => {
            const target = pendingDelete;
            setPendingDelete(null);
            try {
              await googleSheetsHttp.deleteSheet(meta.id, target.sheetId);
              toast.success({ title: 'Pestaña eliminada', message: target.title });
              await onMutate();
            } catch (e) {
              toast.error({
                title: 'No se pudo eliminar',
                message: e instanceof Error ? e.message : ''
              });
            }
          }}
        />
      )}
    </div>
  );
}

function PestanasMini({ meta }: { meta: SpreadsheetMeta }) {
  return (
    <div className="flex h-full flex-col gap-2 rounded-xl bg-bg p-4 shadow-sm">
      <p className="shrink-0 text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
        Pestañas ({meta.sheets.length})
      </p>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <ul className="flex flex-col gap-1.5">
          {meta.sheets.map((s) => (
            <li
              key={s.sheetId}
              className="flex items-center gap-2.5 rounded-lg bg-bg-muted/40 px-3 py-2"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-[10.5px] font-bold text-primary">
                {s.title[0]?.toUpperCase() ?? '·'}
              </span>
              <span className="min-w-0 flex-1 truncate text-[12.5px] font-semibold text-fg">
                {s.title}
              </span>
              <span className="shrink-0 text-[10.5px] text-fg-faint">
                {s.rowCount}×{s.columnCount}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function DetailCard({
  label,
  value,
  mono
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl bg-bg-muted/40 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-faint">
        {label}
      </p>
      <p
        className={cn(
          'mt-1 break-all text-[12.5px] font-medium text-fg',
          mono && 'font-mono text-[11px]'
        )}
      >
        {value}
      </p>
    </div>
  );
}


// ────────────────────────────────────────────────────────────────
// TAB 3: DATOS — pestaña + rango, paste-from-excel, preview, ops
// ────────────────────────────────────────────────────────────────

function DataTab({
  meta,
  sheetId,
  onSheetChange
}: {
  meta: SpreadsheetMeta;
  sheetId: number | null;
  onSheetChange: (v: number | null) => void;
}) {
  const toast = useToast();
  // El ToastProvider crea un objeto `api` nuevo en cada render, así que
  // `toast` cambia de referencia constantemente. Si lo metemos en las
  // deps de un useEffect, el effect se dispara en cada render y entra
  // en bucle (refetchea, setea state, re-renderea, dispara toast.success,
  // refetchea, …). Lo encapsulamos en un ref para usarlo en callbacks
  // async sin agregarlo a las deps.
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const sheet = meta.sheets.find((s) => s.sheetId === sheetId) ?? null;
  // `from`/`to` son lo que el usuario está escribiendo en los inputs —
  // no disparan fetch al cambiar. `activeFrom`/`activeTo` es el rango
  // realmente cargado y mostrado en la grilla. El botón "Consultar"
  // copia los inputs al rango activo y dispara la carga.
  const [from, setFrom] = useState('A1');
  const [to, setTo] = useState('J20');
  const [activeFrom, setActiveFrom] = useState('A1');
  const [activeTo, setActiveTo] = useState('J20');
  // pendingAutoDetect = true → la próxima carga consulta el rango usado
  // real de la hoja (sin pasar A1:to) y setea from/to a esas dimensiones.
  const [pendingAutoDetect, setPendingAutoDetect] = useState(true);
  const skipNext = useRef(false);
  const dims = useMemo(
    () => parseRangeDims(activeFrom, activeTo),
    [activeFrom, activeTo]
  );
  const [rows, setRows] = useState<string[][]>(() =>
    Array.from({ length: dims.rows }, () => Array.from({ length: dims.cols }, () => ''))
  );
  const [original, setOriginal] = useState<string[][]>(() => emptyGrid(dims.rows, dims.cols));
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // Cuando cambia la pestaña, volver a auto-detectar.
  useEffect(() => {
    setPendingAutoDetect(true);
  }, [sheet?.sheetId]);

  const startRef = parseCellRef(activeFrom);
  const colLetter = (i: number): string => {
    const base = startRef?.col ?? 1;
    let n = base + i;
    let s = '';
    while (n > 0) {
      const r = (n - 1) % 26;
      s = String.fromCharCode(65 + r) + s;
      n = Math.floor((n - 1) / 26);
    }
    return s;
  };
  const rowLabel = (i: number): number => (startRef?.row ?? 1) + i;

  // Auto-carga: cuando cambia hoja, pestaña o rango, leer los valores
  // actuales del sheet y mostrarlos como contenido inicial de la tabla.
  // Si pendingAutoDetect=true, pedimos el rango usado completo
  // (`sheet.title` sin rango → Google devuelve el rango con datos).
  useEffect(() => {
    if (!sheet) return;
    if (skipNext.current) {
      skipNext.current = false;
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const range = pendingAutoDetect
          ? sheet.title
          : `${sheet.title}!${activeFrom}:${activeTo}`;
        const r = await googleSheetsHttp.readRange(meta.id, range);
        if (cancelled) return;
        let effFrom = activeFrom;
        let effTo = activeTo;
        const values = r?.values ?? [];
        if (pendingAutoDetect) {
          // Default: A1:J20 (10 cols × 20 filas). Si los datos exceden
          // ese tamaño, extendemos para que entren todos; si caben, NO
          // achicamos — la grilla mínima siempre es J20 aunque haya
          // sólo una celda con datos.
          const MIN_ROWS = 20;
          const MIN_COLS = 10;
          let maxCol = MIN_COLS;
          for (const row of values) if (row.length > maxCol) maxCol = row.length;
          const rowsCount = Math.max(MIN_ROWS, values.length);
          effFrom = 'A1';
          effTo = `${colIdxToLetter(maxCol)}${rowsCount}`;
        }
        const newDims = parseRangeDims(effFrom, effTo);
        const grid = emptyGrid(newDims.rows, newDims.cols);
        for (let i = 0; i < values.length && i < newDims.rows; i++) {
          for (let j = 0; j < values[i].length && j < newDims.cols; j++) {
            const v = values[i][j];
            grid[i][j] = v === null || v === undefined ? '' : String(v);
          }
        }
        setRows(grid);
        setOriginal(grid.map((row) => row.slice()));
        if (pendingAutoDetect) {
          // Ya cargamos los datos en este pasada. El cambio de
          // pendingAutoDetect (y de active*/from/to) va a re-disparar
          // el effect — saltamos ese run para no fetchear dos veces.
          skipNext.current = true;
          if (effFrom !== from) setFrom(effFrom);
          if (effTo !== to) setTo(effTo);
          if (effFrom !== activeFrom) setActiveFrom(effFrom);
          if (effTo !== activeTo) setActiveTo(effTo);
          setPendingAutoDetect(false);
        }
      } catch (e) {
        if (!cancelled) {
          toastRef.current.error({
            title: 'No se pudieron leer los datos',
            message: e instanceof Error ? e.message : ''
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [meta.id, sheet, activeFrom, activeTo, pendingAutoDetect]);

  const dirty = useMemo(() => {
    for (let r = 0; r < dims.rows; r++) {
      for (let c = 0; c < dims.cols; c++) {
        if ((rows[r]?.[c] ?? '') !== (original[r]?.[c] ?? '')) return true;
      }
    }
    return false;
  }, [rows, original, dims.rows, dims.cols]);

  if (meta.sheets.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <EmptyState
          icon={<DatabaseIcon width={22} height={22} />}
          title="Esta hoja no tiene pestañas"
          description="Agregá una primero desde la tab 'Hoja'."
        />
      </div>
    );
  }

  // Estable: las celdas memoizadas no se re-renderean por cambios en
  // otras celdas si la callback no cambia.
  const dimsColsRef = useRef(dims.cols);
  dimsColsRef.current = dims.cols;
  const updateRow = useCallback(
    (rowIdx: number, colIdx: number, v: string): void => {
      const cols = dimsColsRef.current;
      setRows((prev) => {
        const next = prev.slice();
        const row = (next[rowIdx] ?? Array.from({ length: cols }, () => '')).slice();
        while (row.length < cols) row.push('');
        row[colIdx] = v;
        next[rowIdx] = row;
        return next;
      });
    },
    []
  );

  const handleSave = async (): Promise<void> => {
    if (!sheet || saving || !dirty) return;
    const matrix: ValueMatrix = [];
    for (let r = 0; r < dims.rows; r++) {
      const row: CellValue[] = [];
      for (let c = 0; c < dims.cols; c++) row.push(parseCell(rows[r]?.[c] ?? ''));
      matrix.push(row);
    }
    setSaving(true);
    try {
      await googleSheetsHttp.writeRange(
        meta.id,
        `${sheet.title}!${activeFrom}`,
        matrix
      );
      toast.success({
        title: 'Cambios guardados',
        message: `${sheet.title}!${activeFrom}:${activeTo}`
      });
      setOriginal(rows.map((r) => r.slice()));
    } catch (e) {
      toast.error({
        title: 'No se pudieron guardar',
        message: e instanceof Error ? e.message : ''
      });
    } finally {
      setSaving(false);
    }
  };

  // Aplica el rango escrito en los inputs → recarga los datos. Si el
  // input coincide con el activo, no hace nada. Si el rango pedido
  // supera el cap, lo cortamos y avisamos — sin esto el navegador se
  // queda colgado renderizando decenas de miles de celdas.
  const MAX_CELLS = 5000;
  const handleApply = (): void => {
    const f = from.trim().toUpperCase();
    const t = to.trim().toUpperCase();
    if (!f || !t) return;
    if (f === activeFrom && t === activeTo) return;
    const candidate = parseRangeDims(f, t);
    const cells = candidate.rows * candidate.cols;
    if (cells > MAX_CELLS) {
      toast.error({
        title: 'Rango demasiado grande',
        message: `${cells.toLocaleString('es-CO')} celdas excede el límite de ${MAX_CELLS.toLocaleString('es-CO')}. Reducí el rango.`
      });
      return;
    }
    setActiveFrom(f);
    setActiveTo(t);
  };
  const rangeDirty = from !== activeFrom || to !== activeTo;

  return (
    <div className="grid min-h-0 flex-1 grid-rows-[auto_1fr] gap-3 overflow-hidden">
      <div className="rounded-xl bg-bg p-4 shadow-sm">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_1fr_auto_auto_auto]">
          <Select<number>
            options={meta.sheets.map((s) => ({ value: s.sheetId, label: s.title }))}
            value={sheetId}
            onChange={(v) => onSheetChange(v ?? null)}
            placeholder="Pestaña"
            searchable
          />
          <Input
            value={from}
            onChange={(e) => setFrom(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleApply();
            }}
            placeholder="Desde (A1)"
          />
          <Input
            value={to}
            onChange={(e) => setTo(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleApply();
            }}
            placeholder="Hasta (J20)"
          />
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={!sheet || !rangeDirty || loading}
            onClick={handleApply}
          >
            {loading ? 'Consultando…' : rangeDirty ? 'Consultar' : 'Aplicado'}
          </Button>
          <Button
            type="button"
            variant="outline-danger"
            size="md"
            disabled={!sheet}
            onClick={() => setConfirmClear(true)}
          >
            Limpiar rango
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={!sheet || saving || !dirty}
            onClick={() => void handleSave()}
          >
            {saving ? 'Guardando…' : dirty ? 'Guardar' : 'Sin cambios'}
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-bg p-3 shadow-sm">
        {loading ? (
          <div className="flex flex-1 items-center justify-center text-[12px] text-fg-faint">
            Cargando datos…
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full border-collapse text-[12.5px]">
              <thead>
                <tr>
                  <th
                    className="sticky left-0 top-0 z-30 bg-bg-muted px-2 py-1 text-[10.5px] font-semibold text-fg-faint"
                    style={{ width: 44, minWidth: 44 }}
                  />
                  {Array.from({ length: dims.cols }).map((_, c) => {
                    const absCol = (startRef?.col ?? 1) + c;
                    return (
                      <Tooltip key={c} content={`Columna ${absCol}`}>
                        <th
                          className="sticky top-0 z-20 cursor-help bg-bg-muted px-2 py-1 text-[10.5px] font-semibold text-fg-faint"
                          style={{ minWidth: 110 }}
                        >
                          {colLetter(c)}
                        </th>
                      </Tooltip>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: dims.rows }).map((_, r) => (
                  <tr key={r}>
                    <td
                      className="sticky left-0 z-10 bg-bg-muted px-2 py-1 text-center text-[10.5px] text-fg-faint"
                      style={{ width: 44, minWidth: 44 }}
                    >
                      {rowLabel(r)}
                    </td>
                    {Array.from({ length: dims.cols }).map((_, c) => {
                      // Estilo ajedrez: alternamos color base por suma fila+col.
                      const alt = (r + c) % 2 === 0;
                      return (
                        <Cell
                          key={c}
                          r={r}
                          c={c}
                          value={rows[r]?.[c] ?? ''}
                          alt={alt}
                          onChange={updateRow}
                        />
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmClear && (
        <Alert
          type="confirm"
          title="¿Limpiar las celdas?"
          message={`Se borra el contenido de ${sheet?.title ?? ''}!${activeFrom}:${activeTo}.`}
          confirmText="LIMPIAR"
          cancelText="CANCELAR"
          onCancel={() => setConfirmClear(false)}
          onClose={() => setConfirmClear(false)}
          onConfirm={async () => {
            setConfirmClear(false);
            if (!sheet) return;
            try {
              await googleSheetsHttp.clearRange(
                meta.id,
                `${sheet.title}!${activeFrom}:${activeTo}`
              );
              toast.success({
                title: 'Celdas limpiadas',
                message: `${sheet.title}!${activeFrom}:${activeTo}`
              });
              const empty = emptyGrid(dims.rows, dims.cols);
              setRows(empty);
              setOriginal(empty.map((r) => r.slice()));
            } catch (e) {
              toast.error({
                title: 'No se pudo limpiar',
                message: e instanceof Error ? e.message : ''
              });
            }
          }}
        />
      )}
    </div>
  );
}

function emptyGrid(rows: number, cols: number): string[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));
}

// Celda memoizada — sólo se re-renderea si su propio valor cambia.
// Sin esto, escribir en una celda re-renderea las miles de celdas y se
// siente lagueado/pegado.
// Usa <textarea> con `field-sizing: content` para que crezca vertical
// según el contenido SIN JS (sin layout thrashing). Hacer el resize
// con useLayoutEffect en cada celda colgaba el navegador con grids
// grandes. El bg del ajedrez vive en el <td> para que cubra toda la
// altura cuando una fila tiene una celda más alta que el resto.
const CELL_TEXTAREA_STYLE: React.CSSProperties = {
  // CSS nativo: el textarea se redimensiona al contenido sin JS.
  // Soporte: Chrome/Edge 123+, Safari 17.4+. Fallback en navegadores
  // viejos: queda en 1 fila con scroll interno — aceptable.
  fieldSizing: 'content'
} as React.CSSProperties;

const Cell = memo(function Cell({
  r,
  c,
  value,
  alt,
  onChange
}: {
  r: number;
  c: number;
  value: string;
  alt: boolean;
  onChange: (r: number, c: number, v: string) => void;
}) {
  return (
    <td
      className={cn(
        'p-0 align-top',
        alt ? 'bg-bg' : 'bg-bg-muted/40',
        'focus-within:bg-primary-50 dark:focus-within:bg-primary-500/15'
      )}
      style={{ minWidth: 110 }}
    >
      <textarea
        rows={1}
        value={value}
        onChange={(e) => onChange(r, c, e.target.value)}
        style={CELL_TEXTAREA_STYLE}
        className="block w-full resize-none overflow-hidden whitespace-pre-wrap break-words bg-transparent px-2 py-1.5 text-[12.5px] leading-snug text-fg outline-none"
      />
    </td>
  );
});


