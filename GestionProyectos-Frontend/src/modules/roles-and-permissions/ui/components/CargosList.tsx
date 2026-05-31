import { useState } from 'react';
import { cn } from '../../../../shared/lib/cn.js';
import { CheckIcon } from '../../../../shared/components/icons/index.js';
import SearchInput from '../../../../shared/components/SearchInput/index.js';

export interface CargoOption {
  id: string;     // service.code
  label: string;  // service.description
}

export interface CargosListProps {
  /** Catálogo completo de cargos disponibles (viene del backend). */
  options: ReadonlyArray<CargoOption>;
  /** IDs (codes) de los cargos asignados al rol. */
  assigned?: string[];
  onToggle: (cargoId: string) => void;
}

export default function CargosList({
  options,
  assigned = [],
  onToggle
}: CargosListProps) {
  const [query, setQuery] = useState('');

  const filtered = options.filter((c) =>
    c.label.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="flex flex-col gap-2 md:min-h-0 md:flex-1">
      <div className="flex shrink-0 items-center justify-between">
        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
          Cargos
        </span>
        <span className="text-[10.5px] tabular-nums text-fg-faint">
          {assigned.length}/{options.length}
        </span>
      </div>

      <SearchInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar cargo"
      />

      <ul className="flex flex-col pr-1 md:min-h-0 md:flex-1 md:overflow-y-auto">
        {filtered.map((c) => {
          const checked = assigned.includes(c.id);
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onToggle(c.id)}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left outline-none transition-colors',
                  checked
                    ? 'text-fg hover:bg-bg-muted'
                    : 'text-fg-muted hover:bg-bg-muted'
                )}
              >
                <span
                  className={cn(
                    'flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors',
                    checked
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-border bg-bg'
                  )}
                >
                  {checked && (
                    <CheckIcon width={11} height={11} strokeWidth={3} />
                  )}
                </span>
                <span className="truncate text-[12px]">{c.label}</span>
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="px-2 py-3 text-center text-[11px] text-fg-faint">
            {query ? 'Sin resultados' : 'Sin cargos disponibles'}
          </li>
        )}
      </ul>
    </div>
  );
}
