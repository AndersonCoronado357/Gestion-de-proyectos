import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../../shared/lib/cn.js';
import { useCloseOnScroll } from '../../../../shared/lib/useCloseOnScroll.js';
import {
  PlusIcon,
  ChevronDownIcon,
  TrashIcon,
  SearchIcon
} from '../../../../shared/icons/index.js';

const POPUP_MARGIN = 8;
const DESIRED_HEIGHT = 300;

interface PopupPos {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
}

export interface RolesSelectorProps {
  assigned?: string[];
  available?: string[];
  /** Si true, sólo muestra los roles asignados (sin Agregar ni quitar). */
  readOnly?: boolean;
  onAdd?: (role: string) => void;
  onRemove?: (role: string) => void;
}

export default function RolesSelector({
  assigned = [],
  available = [],
  readOnly = false,
  onAdd,
  onRemove
}: RolesSelectorProps) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [pos, setPos] = useState<PopupPos>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: DESIRED_HEIGHT
  });
  const [query, setQuery] = useState('');
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  useCloseOnScroll(open, () => setOpen(false), [popupRef]);

  const unassigned = available.filter((r) => !assigned.includes(r));
  const filtered = unassigned.filter((r) =>
    r.toLowerCase().includes(query.trim().toLowerCase())
  );

  // Decide si abre arriba o abajo según el espacio disponible.
  useEffect(() => {
    if (!open) {
      setReady(false);
      return;
    }
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;

    const viewportH = window.innerHeight;
    const spaceBelow = viewportH - rect.bottom - POPUP_MARGIN;
    const spaceAbove = rect.top - POPUP_MARGIN;

    if (spaceBelow >= DESIRED_HEIGHT || spaceBelow >= spaceAbove) {
      setPos({
        top: rect.bottom + 4,
        bottom: undefined,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(160, Math.min(spaceBelow, DESIRED_HEIGHT))
      });
    } else {
      // Abre arriba: anclamos por bottom y limitamos altura para no quedar
      // detrás del header sticky.
      const HEADER_H = 60;
      setPos({
        top: undefined,
        bottom: viewportH - rect.top + 4,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(160, Math.min(spaceAbove - HEADER_H, DESIRED_HEIGHT))
      });
    }
    setReady(true);
    setQuery('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: globalThis.MouseEvent) => {
      const popup = document.getElementById('roles-selector-popup');
      const target = e.target as Node | null;
      if (popup && target && popup.contains(target)) return;
      if (btnRef.current && target && btnRef.current.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const popup =
    open && ready
      ? createPortal(
          <div
            id="roles-selector-popup"
            ref={popupRef}
            className="fixed z-[100] flex flex-col overflow-hidden rounded-lg bg-bg shadow-lg ring-1 ring-black/5"
            style={{
              top: pos.top,
              bottom: pos.bottom,
              left: pos.left,
              width: pos.width,
              maxHeight: pos.maxHeight
            }}
          >
            <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle px-3 py-2">
              <SearchIcon
                width={12}
                height={12}
                className="shrink-0 text-fg-faint"
              />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar rol"
                className="h-5 w-full bg-transparent text-[12px] text-fg outline-none placeholder:text-fg-faint"
              />
              {unassigned.length > 0 && (
                <span className="shrink-0 text-[10px] tabular-nums text-fg-faint">
                  {filtered.length}/{unassigned.length}
                </span>
              )}
            </div>

            <ul className="min-h-0 flex-1 overflow-y-auto py-1">
              {filtered.map((r) => (
                <li key={r}>
                  <button
                    type="button"
                    onClick={() => {
                      onAdd?.(r);
                      setQuery('');
                      setOpen(false);
                    }}
                    className="w-full px-3 py-1.5 text-left text-[12px] text-fg outline-none transition-colors hover:bg-primary-50 hover:text-primary-700"
                  >
                    {r}
                  </button>
                </li>
              ))}
              {filtered.length === 0 && (
                <li className="px-3 py-3 text-center text-[11px] text-fg-faint">
                  {unassigned.length === 0
                    ? 'Ya tiene todos los roles'
                    : 'Sin resultados'}
                </li>
              )}
            </ul>
          </div>,
          document.body
        )
      : null;

  return (
    <div className="flex flex-col gap-2">
      {!readOnly && (
        <button
          ref={btnRef}
          type="button"
          onClick={() => setOpen((v) => !v)}
          disabled={unassigned.length === 0}
          className={cn(
            'inline-flex h-8 items-center justify-between gap-2 rounded-md bg-bg-muted px-3 outline-none transition-colors',
            'hover:bg-primary-50',
            open && 'bg-primary-50',
            unassigned.length === 0 && 'cursor-not-allowed opacity-60'
          )}
        >
          <span className="inline-flex items-center gap-2 text-[12px] font-medium text-fg-muted">
            <PlusIcon width={12} height={12} strokeWidth={2.5} />
            Agregar rol
          </span>
          <ChevronDownIcon
            width={11}
            height={11}
            className={cn(
              'shrink-0 text-fg-faint transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </button>
      )}

      {assigned.length === 0 ? (
        <p className="px-1 py-2 text-[11px] text-fg-faint">
          Sin roles asignados.
        </p>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {assigned.map((r) => (
            <li
              key={r}
              className="group flex items-center justify-between gap-2 rounded-md px-3 py-2 transition-colors hover:bg-bg-muted/60"
            >
              <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-fg">
                {r}
              </span>
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => onRemove?.(r)}
                  title="Quitar rol"
                  className={cn(
                    'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full outline-none opacity-0 transition-colors group-hover:opacity-100',
                    'text-fg-faint hover:bg-danger-surface hover:text-danger-text',
                    ''
                  )}
                >
                  <TrashIcon width={11} height={11} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {!readOnly && popup}
    </div>
  );
}
