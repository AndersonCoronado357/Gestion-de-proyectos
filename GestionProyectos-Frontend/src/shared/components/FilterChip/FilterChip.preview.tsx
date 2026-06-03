import { useState } from 'react';
import FilterChip from './FilterChip.js';

export const meta = { id: 'filter-chip', name: 'FilterChip (filtro interactivo)' };

type Level = 'error' | 'warn' | 'info' | 'debug';

const LEVELS: Array<{ value: Level; label: string; variant: 'danger' | 'warning' | 'primary' | 'neutral'; count: number }> = [
  { value: 'error', label: 'Error', variant: 'danger', count: 12 },
  { value: 'warn', label: 'Advertencia', variant: 'warning', count: 47 },
  { value: 'info', label: 'Info', variant: 'primary', count: 234 },
  { value: 'debug', label: 'Debug', variant: 'neutral', count: 89 }
];

export default function FilterChipPreview() {
  const [active, setActive] = useState<Set<Level>>(new Set(['error']));
  const toggle = (v: Level) => {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  };
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
        Filtrar por nivel
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {LEVELS.map((l) => (
          <FilterChip
            key={l.value}
            active={active.has(l.value)}
            onClick={() => toggle(l.value)}
            variant={l.variant}
            dot
            count={l.count}
          >
            {l.label}
          </FilterChip>
        ))}
      </div>
      <p className="text-[11.5px] text-fg-muted">
        Seleccionados: <span className="font-mono text-fg">{[...active].join(', ') || '—'}</span>
      </p>
    </div>
  );
}
