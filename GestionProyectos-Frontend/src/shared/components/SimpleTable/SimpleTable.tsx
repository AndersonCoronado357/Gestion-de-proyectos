// SimpleTable — tabla LIMPIA tipo "listado": cabecera en barra (color de la
// app), filas alternadas, texto centrado por defecto, paginación. Sin
// búsqueda ni filtros.
//
//  - Desktop: el HEADER es una barra fija con su propio espacio; SOLO el
//    cuerpo hace scroll (debajo del header). Header y cuerpo son dos tablas
//    distintas pero comparten el mismo <colgroup> + table-fixed y reservan el
//    mismo carril de scrollbar, así las columnas quedan perfectamente
//    alineadas con o sin scroll.
//  - Móvil: cada fila se apila como TARJETA (1ª columna de título, el resto
//    como pares etiqueta/valor) — sin scroll horizontal.

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { cn } from '../../lib/cn.js';
import Pagination from '../DataTable/Pagination.js';

export type SimpleAlign = 'left' | 'center' | 'right';

export interface SimpleColumn<T> {
  id: string;
  label: ReactNode;
  render: (row: T) => ReactNode;
  align?: SimpleAlign;
  width?: string | number;
}

export interface SimpleTableProps<T> {
  data: T[];
  columns: ReadonlyArray<SimpleColumn<T>>;
  rowKey?: (row: T) => string | number;
  initialPageSize?: number;
  emptyMessage?: ReactNode;
}

// Ancho del scrollbar: coincide con `::-webkit-scrollbar { width: 6px }` del
// CSS global. Se reserva en el cuerpo (scrollbar-gutter) y se compensa en el
// header (padding-right) para que las columnas alineen.
const SCROLLBAR = 6;

function alignCls(a: SimpleAlign | undefined): string {
  return a === 'left' ? 'text-left' : a === 'right' ? 'text-right' : 'text-center';
}

export default function SimpleTable<T>({
  data,
  columns,
  rowKey = (row) => (row as { id: string | number }).id,
  initialPageSize = 10,
  emptyMessage = 'Sin datos'
}: SimpleTableProps<T>) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const total = data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const paged = useMemo(
    () => data.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [data, safePage, pageSize]
  );

  useEffect(() => {
    setPage(0);
  }, [pageSize]);

  const colGroup = (
    <colgroup>
      {columns.map((c) => (
        <col key={c.id} style={c.width ? { width: c.width } : undefined} />
      ))}
    </colgroup>
  );

  return (
    <div
      data-search-skip
      className="flex h-full w-full min-h-0 flex-col overflow-hidden rounded-xl bg-bg shadow-sm"
    >
      {/* ── MÓVIL: tarjetas apiladas ─────────────────────────────────── */}
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3 md:hidden">
        {paged.length === 0 ? (
          <div className="px-3 py-10 text-center text-[12px] text-fg-faint">
            {emptyMessage}
          </div>
        ) : (
          paged.map((row) => (
            <div
              key={String(rowKey(row))}
              className="rounded-xl bg-bg-muted p-3.5"
            >
              <div className="space-y-1.5">
                {columns.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start justify-between gap-3"
                  >
                    <span className="shrink-0 pt-px text-[10px] font-semibold uppercase tracking-wider text-fg-faint">
                      {c.label}
                    </span>
                    <span className="min-w-0 break-words text-right text-[12px] text-fg-muted">
                      {c.render(row)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── DESKTOP: header fijo (barra) + cuerpo con scroll debajo ───── */}
      <div className="hidden min-h-0 flex-1 flex-col md:flex">
        {/* Header: FUERA del scroll. El padding-right reserva el carril del
            scrollbar para alinear con el cuerpo; el azul llega de borde a
            borde porque el padding está dentro del div coloreado. */}
        <div className="shrink-0 bg-primary" style={{ paddingRight: SCROLLBAR }}>
          <table className="w-full table-fixed border-separate border-spacing-0">
            {colGroup}
            <thead>
              <tr>
                {columns.map((c) => (
                  <th
                    key={c.id}
                    className={cn(
                      'px-4 py-3 text-[12px] font-semibold tracking-tight text-on-primary',
                      alignCls(c.align)
                    )}
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>

        {/* Cuerpo: el ÚNICO con scroll, debajo del header. */}
        <div
          className="min-h-0 flex-1 overflow-y-auto"
          style={{ scrollbarGutter: 'stable' }}
        >
          <table className="w-full table-fixed border-separate border-spacing-0">
            {colGroup}
            <tbody>
              {paged.map((row, i) => (
                <tr
                  key={String(rowKey(row))}
                  className={cn(
                    i % 2 === 1
                      ? 'bg-primary-50 dark:bg-primary-500/[0.08]'
                      : 'bg-bg'
                  )}
                >
                  {columns.map((c) => (
                    <td
                      key={c.id}
                      className={cn(
                        'px-4 py-2.5 align-middle text-[12px] text-fg-muted',
                        alignCls(c.align)
                      )}
                    >
                      {c.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
              {paged.length === 0 && (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-10 text-center text-[12px] text-fg-faint"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
