import {
  useEffect,
  useRef,
  useState,
  type RefObject,
  type SVGProps
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn.js';
import { useCloseOnScroll } from '../../lib/useCloseOnScroll.js';
import { ChevronDownIcon } from '../../icons/index.js';
import type { ColumnDef } from './DataTable.js';

function FunnelIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={13}
      height={13}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 4h18l-7 9v6l-4 2v-8L3 4z" />
    </svg>
  );
}

function ClearIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={11}
      height={11}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export interface FilterValue {
  columnId: string | null;
  value: string;
}

interface ColumnSelectProps {
  anchorRef: RefObject<HTMLButtonElement | null>;
  open: boolean;
  onClose: () => void;
  columns: ReadonlyArray<ColumnDef<unknown>>;
  selectedId: string | null;
  onSelect: (columnId: string) => void;
  onClear: () => void;
}

interface PopupPos {
  top: number;
  left: number;
  width: number;
}

function ColumnSelect({
  anchorRef,
  open,
  onClose,
  columns,
  selectedId,
  onSelect,
  onClear
}: ColumnSelectProps) {
  const [ready, setReady] = useState(false);
  const [pos, setPos] = useState<PopupPos>({ top: 0, left: 0, width: 0 });
  const popupRef = useRef<HTMLDivElement | null>(null);

  useCloseOnScroll(open, onClose, [popupRef]);

  useEffect(() => {
    if (!open) {
      setReady(false);
      return;
    }
    const rect = anchorRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({
        top: rect.bottom + 4,
        left: rect.left,
        width: rect.width
      });
      setReady(true);
    }
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: globalThis.MouseEvent) => {
      const popup = document.getElementById('filterby-column-popup');
      const target = e.target as Node | null;
      if (popup && target && popup.contains(target)) return;
      if (anchorRef.current && target && anchorRef.current.contains(target)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, anchorRef, onClose]);

  if (!open || !ready) return null;

  return createPortal(
    <div
      id="filterby-column-popup"
      ref={popupRef}
      className="fixed z-[100] flex max-h-[320px] flex-col overflow-hidden rounded-md bg-bg py-1 shadow-lg ring-1 ring-black/5"
      style={{ top: pos.top, left: pos.left, width: pos.width }}
    >
      <button
        type="button"
        onClick={() => {
          onClear();
          onClose();
        }}
        className={cn(
          'flex h-8 w-full items-center justify-center px-3 text-[12px] font-medium outline-none transition-colors',
          selectedId ? 'text-fg-faint hover:bg-bg-muted' : 'text-fg-faint'
        )}
      >
        Seleccionar
      </button>
      <ul className="min-h-0 flex-1 overflow-y-auto">
        {columns.map((c) => {
          const active = c.id === selectedId;
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className={cn(
                  'flex h-8 w-full items-center justify-center px-3 text-[12px] font-medium outline-none transition-colors',
                  active
                    ? 'bg-primary text-on-primary'
                    : 'text-fg hover:bg-bg-muted'
                )}
              >
                {c.label}
              </button>
            </li>
          );
        })}
        {columns.length === 0 && (
          <li className="px-3 py-3 text-center text-[11px] text-fg-faint">
            Sin columnas filtrables
          </li>
        )}
      </ul>
    </div>,
    document.body
  );
}

export interface FilterByControlProps<T = unknown> {
  filterableColumns: ReadonlyArray<ColumnDef<T>>;
  data: T[];
  columnId: string | null;
  value: string;
  onChange: (next: FilterValue) => void;
}

export default function FilterByControl<T>({
  filterableColumns,
  columnId,
  value,
  onChange
}: FilterByControlProps<T>) {
  const [openCol, setOpenCol] = useState(false);
  const colRef = useRef<HTMLButtonElement | null>(null);

  const selectedColumn = filterableColumns.find((c) => c.id === columnId) ?? null;
  const hasFilter = !!selectedColumn || !!value;

  const handleSelectColumn = (newColumnId: string) => {
    onChange({ columnId: newColumnId, value: '' });
    setOpenCol(false);
  };

  const handleClear = () => {
    onChange({ columnId: null, value: '' });
  };

  return (
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-primary-700">
        <FunnelIcon />
        Filtrar por
      </span>

      <div className="flex h-8 items-stretch">
        <button
          ref={colRef}
          type="button"
          onClick={() => setOpenCol((v) => !v)}
          className={cn(
            'inline-flex h-full min-w-[150px] items-center justify-between gap-2 rounded-l-md px-3 outline-none transition-colors',
            'bg-primary text-on-primary hover:bg-primary-700'
          )}
        >
          <span className="truncate text-[12px] font-semibold">
            {selectedColumn?.label ?? 'Seleccionar'}
          </span>
          <ChevronDownIcon
            width={11}
            height={11}
            className={cn(
              'shrink-0 transition-transform duration-200',
              openCol && 'rotate-180'
            )}
          />
        </button>

        <input
          type="text"
          disabled={!selectedColumn}
          value={value}
          onChange={(e) => onChange({ columnId, value: e.target.value })}
          placeholder={
            selectedColumn
              ? `Filtrar ${String(selectedColumn.label).toLowerCase()}`
              : 'Elige una columna'
          }
          className={cn(
            'h-full min-w-[200px] rounded-r-md bg-primary-50 px-3 text-[12px] font-medium text-primary-700 outline-none',
            'placeholder:font-normal placeholder:text-primary-700/55',
            'disabled:cursor-not-allowed disabled:opacity-60'
          )}
        />
      </div>

      {hasFilter && (
        <button
          type="button"
          onClick={handleClear}
          title="Limpiar filtro"
          className={cn(
            'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full outline-none transition-colors',
            'text-fg-faint hover:bg-danger-surface hover:text-danger-text',
            ''
          )}
        >
          <ClearIcon />
        </button>
      )}

      <ColumnSelect
        anchorRef={colRef}
        open={openCol}
        onClose={() => setOpenCol(false)}
        columns={filterableColumns as ReadonlyArray<ColumnDef<unknown>>}
        selectedId={columnId}
        onSelect={handleSelectColumn}
        onClear={handleClear}
      />
    </div>
  );
}
