import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn.js';
import { useCloseOnScroll } from '../../lib/useCloseOnScroll.js';
import { ChevronDownIcon, CheckIcon } from '../../icons/index.js';
import SearchInput from '../SearchInput/index.js';
import type { ColumnDef } from './DataTable.js';

interface PopupPos {
  top: number;
  left: number;
  width: number;
}

interface FilterOption {
  id: string;
  label: string;
  count: number;
}

export interface ColumnFilterProps<T = unknown> {
  column: ColumnDef<T>;
  value: string | null;
  onChange: (value: string | null) => void;
  data: T[];
}

export default function ColumnFilter<T>({
  column,
  value,
  onChange,
  data
}: ColumnFilterProps<T>) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState('');
  const [pos, setPos] = useState<PopupPos>({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  useCloseOnScroll(open, () => setOpen(false), [popupRef]);

  const options: FilterOption[] = useMemo(() => {
    const map = new Map<string, number>();
    data.forEach((row) => {
      const v = column.accessor(row);
      if (v === null || v === undefined || v === '') return;
      const key = String(v);
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([id, count]) => ({
        id,
        label: column.filterLabelFor ? column.filterLabelFor(id) : id,
        count
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [data, column]);

  useEffect(() => {
    if (!open) {
      setReady(false);
      return;
    }
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({
        top: rect.bottom + 6,
        left: rect.left,
        width: Math.max(rect.width, 240)
      });
      setReady(true);
    }
    setQuery('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onMouseDown = (e: globalThis.MouseEvent) => {
      const popup = document.getElementById(`col-filter-${column.id}`);
      const target = e.target as Node | null;
      if (popup && target && popup.contains(target)) return;
      if (btnRef.current && target && btnRef.current.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, column.id]);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.trim().toLowerCase())
  );

  const currentLabel = value
    ? (options.find((o) => o.id === value)?.label ?? value)
    : null;

  const popup =
    open && ready
      ? createPortal(
          <div
            id={`col-filter-${column.id}`}
            ref={popupRef}
            className="fixed z-[100] flex max-h-[340px] flex-col overflow-hidden rounded-lg bg-bg p-2 shadow-lg ring-1 ring-black/5"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            <div className="shrink-0 px-1 pb-2">
              <SearchInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Filtrar ${String(column.label).toLowerCase()}`}
              />
            </div>
            <ul className="min-h-0 flex-1 overflow-y-auto">
              <li>
                <button
                  type="button"
                  onClick={() => {
                    onChange(null);
                    setOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left outline-none transition-colors',
                    !value
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-fg hover:bg-bg-muted'
                  )}
                >
                  <span className="text-[12px] font-medium">Todos</span>
                  {!value && <CheckIcon width={12} height={12} strokeWidth={2.5} />}
                </button>
              </li>
              {filtered.map((o) => {
                const active = value === o.id;
                return (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(o.id);
                        setOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left outline-none transition-colors',
                        active
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-fg hover:bg-bg-muted'
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate text-[12px]">
                        {o.label}
                      </span>
                      <span
                        className={cn(
                          'shrink-0 text-[10.5px] tabular-nums',
                          active ? 'text-primary-700/70' : 'text-fg-faint'
                        )}
                      >
                        {o.count}
                      </span>
                      {active && (
                        <CheckIcon width={12} height={12} strokeWidth={2.5} />
                      )}
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="px-2 py-3 text-center text-[11px] text-fg-faint">
                  Sin resultados
                </li>
              )}
            </ul>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex h-9 items-center gap-2 rounded-md px-3 outline-none transition-colors',
          value
            ? 'bg-primary-50 text-primary-700 hover:bg-primary-100'
            : 'bg-bg-muted text-fg-muted hover:bg-bg-muted/70',
          open && 'ring-2 ring-primary/15'
        )}
      >
        <span className="text-[11px] font-medium text-fg-faint">
          {column.label}
        </span>
        <span
          className={cn(
            'min-w-0 max-w-[120px] truncate text-[12px] font-semibold',
            value ? 'text-primary-700' : 'text-fg'
          )}
        >
          {currentLabel ?? 'Todos'}
        </span>
        <ChevronDownIcon
          width={12}
          height={12}
          className={cn(
            'shrink-0 transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>
      {popup}
    </>
  );
}
