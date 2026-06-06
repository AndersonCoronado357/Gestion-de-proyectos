// IconPicker inline para el panel de propiedades: muestra el grid
// directo (sin modal/popover). El usuario filtra y elige.

import { useEffect, useState } from 'react';
import SearchInput from '../../../../shared/components/SearchInput/index.js';
import { normalizeIconSvg } from '../../../icons/ui/lib/normalizeIconSvg.js';
import { listIcons, type IconItem } from '../../../icons/api.js';
import { cn } from '../../../../shared/lib/cn.js';

interface Props {
  value: string | null;
  onChange: (svg: string | null) => void;
}

export default function InlineIconPicker({ value, onChange }: Props) {
  const [icons, setIcons] = useState<IconItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listIcons({ limit: 500 })
      .then((r) => {
        if (!cancelled) setIcons(r.items);
      })
      .catch(() => {
        if (!cancelled) setIcons([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = query.trim()
    ? icons.filter(
        (i) =>
          (i.name ?? '').toLowerCase().includes(query.trim().toLowerCase()) ||
          (i.displayName ?? '').toLowerCase().includes(query.trim().toLowerCase())
      )
    : icons;

  const isSelected = (svg: string): boolean => value === svg;

  return (
    <div className="flex h-full min-h-[320px] flex-1 flex-col gap-1.5">
      <SearchInput
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Buscar icono"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="self-start text-[10.5px] text-fg-faint underline outline-none hover:text-danger-text"
        >
          Quitar icono actual
        </button>
      )}
      {loading ? (
        <p className="px-2 py-3 text-center text-[11px] text-fg-faint">
          Cargando catálogo…
        </p>
      ) : filtered.length === 0 ? (
        <p className="px-2 py-3 text-center text-[11px] text-fg-faint">
          Sin resultados.
        </p>
      ) : (
        <div className="grid flex-1 grid-cols-6 gap-1 overflow-y-auto rounded-md bg-bg-muted p-2">
          {filtered.map((icon) => (
            <button
              key={icon.id}
              type="button"
              onClick={() => onChange(icon.svg)}
              title={icon.displayName ?? icon.name ?? ''}
              className={cn(
                'inline-flex aspect-square w-full items-center justify-center rounded-md outline-none transition-colors',
                'text-fg-muted hover:bg-bg hover:text-fg',
                '[&_svg]:h-5 [&_svg]:w-5',
                isSelected(icon.svg) && 'bg-bg text-fg ring-1 ring-fg-faint'
              )}
              dangerouslySetInnerHTML={{ __html: normalizeIconSvg(icon.svg) }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
