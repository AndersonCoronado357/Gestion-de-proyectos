// FilterBar — barra de filtros genérica para listados.
//
// Soporta un buscador, N selects y una zona de "extras" libre. Está pensada
// para ir POR ENCIMA de una tabla / lista, con un patrón responsive limpio:
//
//   - Mobile (< sm):  cada control en su propia fila, full-width.
//   - sm – md:        grid 2 columnas para los selects, búsqueda full.
//   - lg+:            todo en una fila con la búsqueda ocupando el espacio.
//
// Es agnóstica al dominio: no sabe qué se filtra. Cada llamado pasa sus
// opciones, valores y handlers. Se monta sobre Select / SearchInput
// existentes — sin look nuevo.

import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.js';
import SearchInput from '../SearchInput/index.js';
import Select, { type SelectOptionInput } from '../Select/index.js';

export interface FilterBarSelect<V extends string | number = string> {
  /** Identificador estable — útil si el caller lo necesita en logs/tests. */
  id?: string;
  options: ReadonlyArray<SelectOptionInput<V>>;
  value: V | null | undefined;
  onChange: (v: V | null) => void;
  placeholder?: string;
  /** Ancho fijo en lg+. En mobile / sm siempre es full-width. Default 170. */
  width?: number;
  searchable?: boolean;
}

export interface FilterBarSearch {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface FilterBarProps {
  search?: FilterBarSearch;
  /** Lista de selects que se renderizan a continuación del buscador. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  selects?: ReadonlyArray<FilterBarSelect<any>>;
  /** Bloque libre al final (botones extra, switch, etc.). */
  extras?: ReactNode;
  className?: string;
}

export default function FilterBar({
  search,
  selects,
  extras,
  className
}: FilterBarProps) {
  return (
    <div className={cn('rounded-xl bg-bg p-3 shadow-sm sm:p-4', className)}>
      <div
        className={cn(
          'grid gap-3',
          // 1 col en mobile, 2 en sm, auto-flow en lg+.
          'grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center'
        )}
      >
        {search && (
          <div className="lg:min-w-[220px] lg:flex-1 sm:col-span-2">
            <SearchInput
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
              placeholder={search.placeholder ?? 'Buscar'}
            />
          </div>
        )}

        {selects?.map((s, i) => (
          <div
            key={s.id ?? i}
            className="lg:flex-none"
            style={{
              // lg+: ancho fijo; abajo de lg el grid manda y stretchea.
              ...(s.width ? { ['--fb-w' as string]: `${s.width}px` } : {})
            }}
          >
            <div
              className="w-full lg:w-[var(--fb-w,170px)]"
              style={{ ['--fb-w' as string]: s.width ? `${s.width}px` : '170px' }}
            >
              <Select
                options={s.options}
                value={s.value}
                onChange={s.onChange}
                placeholder={s.placeholder}
                searchable={s.searchable}
              />
            </div>
          </div>
        ))}

        {extras && (
          <div className="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-auto lg:ml-auto">
            {extras}
          </div>
        )}
      </div>
    </div>
  );
}
