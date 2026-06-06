// Panel izquierdo del editor: cada preset = una variante puntual de un
// componente (ej. "Botón primario" / "Botón peligro" como entries
// distintas). Vista compacta con preview en vivo a la izquierda.

import { useMemo, useState, type DragEvent } from 'react';
import SearchInput from '../../../../shared/components/SearchInput/index.js';
import {
  PRESETS,
  getBlockDef,
  type BlockDef,
  type Preset
} from '../../lib/blockManifest.js';

export const DRAG_MIME = 'application/x-design-block-type';

interface Props {
  /** No usado por ahora — drag-only. */
  onAddBlock?: (presetId: string) => void;
}

function mergeProps(def: BlockDef, preset: Preset): Record<string, unknown> {
  return { ...structuredClone(def.defaultProps), ...(preset.defaultProps ?? {}) };
}

export default function ComponentsPanel({ onAddBlock }: Props) {
  const [query, setQuery] = useState('');

  const grouped = useMemo<Record<string, Preset[]>>(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? PRESETS.filter((p) => p.label.toLowerCase().includes(q))
      : PRESETS;
    const map: Record<string, Preset[]> = {};
    for (const p of filtered) {
      (map[p.group] ||= []).push(p);
    }
    return map;
  }, [query]);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, presetId: string): void => {
    const payload = `preset/${presetId}`;
    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData(DRAG_MIME, payload);
    e.dataTransfer.setData('text/plain', payload);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="shrink-0 px-3 pt-3 pb-2">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
          Componentes
        </p>
        <div className="mt-2">
          <SearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {Object.entries(grouped).length === 0 && (
          <p className="px-3 py-6 text-center text-[11.5px] text-fg-faint">
            Nada coincide con la búsqueda.
          </p>
        )}
        {Object.entries(grouped).map(([group, defs]) => (
          <div key={group} className="mb-3 last:mb-0">
            <p className="mb-1 px-2 text-[9.5px] font-semibold uppercase tracking-wider text-fg-faint">
              {group}
            </p>
            <div className="flex flex-col">
              {defs.map((preset) => {
                const def = getBlockDef(preset.type);
                if (!def) return null;
                const props = mergeProps(def, preset);
                return (
                  <div
                    key={preset.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, preset.id)}
                    onDoubleClick={() => onAddBlock?.(preset.id)}
                    title={`${preset.label} — arrastrá al frame`}
                    className="group flex cursor-grab items-center gap-2 rounded-md px-2 py-1.5 text-[12px] text-fg-muted transition-colors hover:bg-bg-muted hover:text-fg active:cursor-grabbing"
                  >
                    {/* Preview en vivo (mini, clipped). El inner span tiene
                        las dimensiones nativas del componente (def.defaultSize)
                        para que charts con `h-full w-full` tengan algo de
                        donde heredar, y se escala dinámicamente para entrar
                        en el thumbnail. */}
                    <span
                      className="pointer-events-none flex h-7 w-10 shrink-0 items-center justify-center overflow-hidden rounded bg-bg ring-1 ring-border-subtle"
                    >
                      <span
                        className="block"
                        style={{
                          width: def.defaultSize.w,
                          height: def.defaultSize.h,
                          transform: `scale(${Math.min(40 / def.defaultSize.w, 28 / def.defaultSize.h)})`,
                          transformOrigin: 'center'
                        }}
                      >
                        {def.render(props, { isEditing: true })}
                      </span>
                    </span>
                    <span className="truncate">{preset.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
