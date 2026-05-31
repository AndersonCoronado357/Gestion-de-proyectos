import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { cn } from '../../lib/cn.js';
import SearchInput from '../SearchInput/index.js';
import FilterByControl from './FilterByControl.js';
import Pagination from './Pagination.js';
import { useSearchQuery } from '../../search/SearchContext.js';

export type SortDir = 'asc' | 'desc';
export type ColumnAlign = 'left' | 'center' | 'right';

export interface ColumnDef<T = unknown> {
  id: string;
  label: ReactNode;
  accessor: (row: T) => unknown;
  render?: (row: T) => ReactNode;
  filter?: 'select';
  filterLabelFor?: (raw: string) => string;
  width?: string | number;
  sortable?: boolean;
  align?: ColumnAlign;
}

export interface DataTableProps<T = unknown> {
  data: T[];
  columns: ReadonlyArray<ColumnDef<T>>;
  rowKey?: (row: T) => string | number;
  onRowClick?: (key: string | number, row: T) => void;
  initialPageSize?: number;
  searchPlaceholder?: string;
  emptyMessage?: ReactNode;
}

interface SortArrowProps {
  active: boolean;
  dir: SortDir;
}

function SortArrow({ active, dir }: SortArrowProps) {
  return (
    <svg
      width={9}
      height={9}
      viewBox="0 0 10 10"
      className={cn(
        'shrink-0 transition-opacity',
        active ? 'opacity-100' : 'opacity-30'
      )}
    >
      <path
        d={dir === 'asc' ? 'M1 6 L5 2 L9 6' : 'M1 4 L5 8 L9 4'}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const stringify = (v: unknown): string => (v ?? '').toString().toLowerCase();

interface ActiveFilter {
  columnId: string | null;
  value: string;
}

interface SortState {
  column: string | null;
  dir: SortDir;
}

export default function DataTable<T>({
  data,
  columns,
  rowKey = (row) => (row as { id: string | number }).id,
  onRowClick,
  initialPageSize = 10,
  searchPlaceholder = 'Buscar',
  emptyMessage = 'Sin datos'
}: DataTableProps<T>) {
  // Tres fuentes de filtrado, todas combinadas con AND:
  //   1. `headerQuery` — el SearchInput global del header (contexto).
  //   2. `localQuery`  — el SearchInput propio de la tabla (a la derecha).
  //   3. `activeFilter` — FilterByControl: columna específica + valor.
  const headerQuery = useSearchQuery();
  const [localQuery, setLocalQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>({
    columnId: null,
    value: ''
  });
  const [sort, setSort] = useState<SortState>({ column: null, dir: 'asc' });
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const filterableColumns = columns.filter((c) => c.filter === 'select');

  const filtered = useMemo(() => {
    const hq = headerQuery.trim().toLowerCase();
    const lq = localQuery.trim().toLowerCase();
    const fq = activeFilter.value.trim().toLowerCase();

    return data.filter((row) => {
      // Search global (header) — matchea contra cualquier columna.
      if (hq) {
        const ok = columns.some((c) => stringify(c.accessor(row)).includes(hq));
        if (!ok) return false;
      }
      // Search local (input propio de la tabla) — también contra cualquiera.
      if (lq) {
        const ok = columns.some((c) => stringify(c.accessor(row)).includes(lq));
        if (!ok) return false;
      }
      // Filtro por columna específica.
      if (activeFilter.columnId && fq) {
        const col = columns.find((c) => c.id === activeFilter.columnId);
        if (col && !stringify(col.accessor(row)).includes(fq)) return false;
      }
      return true;
    });
  }, [data, headerQuery, localQuery, activeFilter, columns]);

  const sorted = useMemo(() => {
    if (!sort.column) return filtered;
    const col = columns.find((c) => c.id === sort.column);
    if (!col) return filtered;
    const mult = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = stringify(col.accessor(a));
      const bv = stringify(col.accessor(b));
      if (av < bv) return -1 * mult;
      if (av > bv) return 1 * mult;
      return 0;
    });
  }, [filtered, sort, columns]);

  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);

  useEffect(() => {
    setPage(0);
  }, [headerQuery, localQuery, activeFilter, sort, pageSize]);

  const handleSort = (col: ColumnDef<T>) => {
    if (col.sortable === false) return;
    setSort((prev) =>
      prev.column === col.id
        ? { column: col.id, dir: prev.dir === 'desc' ? 'asc' : 'desc' }
        : { column: col.id, dir: 'desc' }
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex shrink-0 flex-wrap items-center gap-3 px-3 pt-4 pb-3 sm:flex-nowrap sm:px-5">
        {filterableColumns.length > 0 && (
          <FilterByControl
            filterableColumns={filterableColumns}
            data={data}
            columnId={activeFilter.columnId}
            value={activeFilter.value}
            onChange={setActiveFilter}
          />
        )}

        {/* Buscador GENERAL local de la tabla (a la derecha).  Combina con
            el del header — escribir en cualquiera de los dos filtra; la
            tabla queda con la intersección.  Es útil cuando querés
            filtrar SOLO esta tabla sin tocar el resto de la app. */}
        <div className="ml-auto w-72 max-w-full">
          <SearchInput
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder={searchPlaceholder}
          />
        </div>
      </div>

      {/* Móvil: cada fila como tarjeta apilada — sin scroll horizontal. La
          1ª columna va de "cabecera" y el resto como pares etiqueta/valor. */}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 pb-3 md:hidden">
        {paged.map((row, i) => (
          <button
            key={String(rowKey(row))}
            type="button"
            onClick={() => onRowClick?.(rowKey(row), row)}
            style={{ animationDelay: `${i * 12}ms` }}
            className="block w-full animate-[slide-up-fade_180ms_ease-out_both] rounded-xl bg-bg-muted p-3.5 text-left outline-none transition-colors active:bg-primary-500/10"
          >
            {columns[0] && (
              <div className="mb-2.5">
                {columns[0].render
                  ? columns[0].render(row)
                  : ((columns[0].accessor(row) as ReactNode) ?? '—')}
              </div>
            )}
            <div className="space-y-1.5">
              {columns.slice(1).map((c) => (
                <div
                  key={c.id}
                  className="flex items-start justify-between gap-3"
                >
                  <span className="shrink-0 pt-px text-[10px] font-semibold uppercase tracking-wider text-fg-faint">
                    {c.label}
                  </span>
                  <span className="min-w-0 break-words text-right text-[12px] text-fg-muted">
                    {c.render ? c.render(row) : ((c.accessor(row) as ReactNode) ?? '—')}
                  </span>
                </div>
              ))}
            </div>
          </button>
        ))}
        {paged.length === 0 && (
          <div className="px-3 py-10 text-center text-[12px] text-fg-faint">
            {emptyMessage}
          </div>
        )}
      </div>

      {/* Desktop: tabla normal. */}
      <div className="hidden min-h-0 flex-1 overflow-auto px-3 sm:px-5 md:block">
        <table className="w-full min-w-[480px] table-fixed border-separate border-spacing-0 sm:min-w-[560px]">
          <colgroup>
            {columns.map((c) => (
              <col key={c.id} style={c.width ? { width: c.width } : undefined} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-[1] bg-bg">
            <tr>
              {columns.map((c) => {
                const active = sort.column === c.id;
                const align = c.align ?? 'center';
                const textAlignCls =
                  align === 'left'
                    ? 'text-left'
                    : align === 'right'
                      ? 'text-right'
                      : 'text-center';
                return (
                  <th
                    key={c.id}
                    className={cn(
                      'px-2 pb-2.5 pt-2 text-[10px] font-semibold uppercase tracking-wider text-fg-faint sm:px-3',
                      textAlignCls
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(c)}
                      disabled={c.sortable === false}
                      className={cn(
                        'inline-flex items-center gap-1.5 outline-none transition-colors',
                        c.sortable !== false ? 'hover:text-fg' : 'cursor-default',
                        align === 'right' && 'flex-row-reverse'
                      )}
                    >
                      {c.label}
                      {c.sortable !== false && (
                        <SortArrow
                          active={active}
                          dir={active ? sort.dir : 'asc'}
                        />
                      )}
                    </button>
                  </th>
                );
              })}
            </tr>
            <tr>
              <td
                colSpan={columns.length}
                className="h-px bg-border-subtle p-0"
              />
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr
                key={String(rowKey(row))}
                onClick={() => onRowClick?.(rowKey(row), row)}
                style={{ animationDelay: `${i * 12}ms` }}
                className={cn(
                  'group cursor-pointer outline-none',
                  'animate-[slide-up-fade_180ms_ease-out_both]',
                  'even:bg-bg-muted',
                  'transition-shadow duration-150',
                  'hover:shadow-[inset_0_0_0_999px_rgb(var(--color-primary-500)_/_0.08)]'
                )}
              >
                {columns.map((c) => {
                  const align = c.align ?? 'center';
                  return (
                    <td
                      key={c.id}
                      className={cn(
                        'px-2 py-2.5 align-middle sm:px-3',
                        align === 'left'
                          ? 'text-left'
                          : align === 'right'
                            ? 'text-right'
                            : 'text-center'
                      )}
                    >
                      {c.render
                        ? c.render(row)
                        : ((c.accessor(row) as ReactNode) ?? '—')}
                    </td>
                  );
                })}
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-3 py-10 text-center text-[12px] text-fg-faint"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="h-px shrink-0 bg-border-subtle" />

      <Pagination
        page={safePage}
        pageSize={pageSize}
        total={total}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
