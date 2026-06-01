import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn.js';
import { useCloseOnScroll } from '../../lib/useCloseOnScroll.js';
import {
  ChevronDownIcon,
  CheckIcon,
  SearchIcon
} from '../../icons/index.js';

const POPUP_MARGIN = 8;
const DEFAULT_HEIGHT = 300;

export interface SelectOption<V = string> {
  value: V;
  label: string;
}

export type SelectOptionInput<V = string> = V | SelectOption<V>;

interface SelectPosition {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
  above: boolean;
}

export interface SelectProps<V = string> {
  options: ReadonlyArray<SelectOptionInput<V>>;
  value: V | null | undefined;
  onChange?: (value: V) => void;
  placeholder?: string;
  searchable?: boolean;
  label?: ReactNode;
  error?: ReactNode;
  hint?: ReactNode;
  className?: string;
  disabled?: boolean;
  /** Alto máximo del dropdown en px. Default 300. */
  maxHeight?: number;
  /** Alineación del texto de cada opción. Default 'left'. */
  itemAlign?: 'left' | 'center';
}

/**
 * Select2-style: combobox con buscador interno opcional.
 */
export default function Select<V extends string | number = string>({
  options = [],
  value,
  onChange,
  placeholder = 'Seleccionar',
  searchable = false,
  label,
  error,
  hint,
  className,
  disabled,
  maxHeight,
  itemAlign = 'left'
}: SelectProps<V>) {
  const desiredHeight = maxHeight ?? DEFAULT_HEIGHT;
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [pos, setPos] = useState<SelectPosition>({
    top: 0,
    left: 0,
    width: 0,
    maxHeight: desiredHeight,
    above: false
  });
  const [query, setQuery] = useState('');
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);

  useCloseOnScroll(open, () => setOpen(false), [popupRef]);

  const items: SelectOption<V>[] = useMemo(
    () =>
      options.map((o) =>
        typeof o === 'string' || typeof o === 'number'
          ? { value: o as V, label: String(o) }
          : (o as SelectOption<V>)
      ),
    [options]
  );

  const selected = items.find((i) => i.value === value) ?? null;
  const filtered = searchable
    ? items.filter((i) =>
        i.label.toLowerCase().includes(query.trim().toLowerCase())
      )
    : items;

  useEffect(() => {
    if (!open) {
      setReady(false);
      return;
    }
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const spaceBelow = window.innerHeight - rect.bottom - POPUP_MARGIN;
    const spaceAbove = rect.top - POPUP_MARGIN;
    const HEADER_H = 60;
    const above = !(spaceBelow >= desiredHeight || spaceBelow >= spaceAbove);
    const maxHeight = Math.max(
      160,
      Math.min(above ? spaceAbove - HEADER_H : spaceBelow, desiredHeight)
    );
    if (above) {
      setPos({
        bottom: window.innerHeight - rect.top + 4,
        top: undefined,
        left: rect.left,
        width: rect.width,
        maxHeight,
        above
      });
    } else {
      setPos({
        top: rect.bottom + 4,
        bottom: undefined,
        left: rect.left,
        width: rect.width,
        maxHeight,
        above
      });
    }
    setReady(true);
    setQuery('');
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const popup = document.getElementById('select-popup-anchor');
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
            id="select-popup-anchor"
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
            {searchable && (
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
                  placeholder="Buscar"
                  className="h-5 w-full bg-transparent text-[12px] text-fg outline-none placeholder:text-fg-faint"
                />
              </div>
            )}
            <ul className="min-h-0 flex-1 overflow-y-auto py-1">
              {filtered.map((it) => {
                const active = it.value === value;
                return (
                  <li key={String(it.value)}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange?.(it.value);
                        setOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-2 px-3 py-1.5 text-[12px] outline-none transition-colors',
                        itemAlign === 'center'
                          ? 'justify-center text-center'
                          : 'justify-between text-left',
                        active
                          ? 'bg-primary-50 font-semibold text-primary-700'
                          : 'text-fg hover:bg-bg-muted'
                      )}
                    >
                      <span className="min-w-0 flex-1 truncate">{it.label}</span>
                      {active && itemAlign !== 'center' && (
                        <CheckIcon width={11} height={11} strokeWidth={2.5} />
                      )}
                    </button>
                  </li>
                );
              })}
              {filtered.length === 0 && (
                <li className="px-3 py-3 text-center text-[11px] text-fg-faint">
                  Sin resultados
                </li>
              )}
            </ul>
          </div>,
          document.body
        )
      : null;

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label className="mb-1.5 block text-[12.5px] font-medium text-fg-muted">
          {label}
        </label>
      )}

      <button
        ref={btnRef}
        type="button"
        onClick={() => !disabled && setOpen((v) => !v)}
        disabled={disabled}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2 rounded-md bg-bg-muted px-3 outline-none transition-colors',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        <span
          className={cn(
            'min-w-0 flex-1 truncate text-left text-[12.5px]',
            selected ? 'text-fg' : 'text-fg-faint'
          )}
        >
          {selected?.label ?? placeholder}
        </span>
        <ChevronDownIcon
          width={12}
          height={12}
          className={cn(
            'shrink-0 text-fg-faint transition-transform duration-200',
            open && 'rotate-180'
          )}
        />
      </button>

      {error ? (
        <p className="mt-1.5 text-[12px] text-danger-text">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[12px] text-fg-subtle">{hint}</p>
      ) : null}

      {popup}
    </div>
  );
}
