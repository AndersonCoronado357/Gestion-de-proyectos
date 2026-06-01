import { useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn.js';
import { useCloseOnScroll } from '../../lib/useCloseOnScroll.js';
import { CalendarIcon } from '../../icons/index.js';
import Calendar from '../Calendar/index.js';

const CAL_WIDTH = 280;
const CAL_HEIGHT = 320;
const MARGIN = 6;
const HEADER_H = 60;

export type DateFormat = 'es' | 'iso';

interface PopupPosition {
  top?: number;
  bottom?: number;
  left: number;
}

export interface DateInputProps {
  value?: Date | null;
  onChange?: (date: Date) => void;
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  placeholder?: string;
  format?: DateFormat;
  className?: string;
  /** Mínima fecha seleccionable (inclusive). */
  minDate?: Date | null;
  /** Máxima fecha seleccionable (inclusive). */
  maxDate?: Date | null;
}

export default function DateInput({
  value,
  onChange,
  label,
  hint,
  error,
  placeholder = 'Selecciona fecha',
  format = 'es',
  className,
  minDate,
  maxDate
}: DateInputProps) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [pos, setPos] = useState<PopupPosition>({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const popupRef = useRef<HTMLDivElement | null>(null);
  const hasError = !!error;

  useCloseOnScroll(open, () => setOpen(false), [popupRef]);

  useEffect(() => {
    if (!open) {
      setReady(false);
      return;
    }
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const spaceBelow = vh - rect.bottom - MARGIN;
    const spaceAbove = rect.top - MARGIN - HEADER_H;
    const left = Math.min(Math.max(8, rect.left), vw - CAL_WIDTH - 8);

    if (spaceBelow >= CAL_HEIGHT || spaceBelow >= spaceAbove) {
      setPos({ top: rect.bottom + MARGIN, bottom: undefined, left });
    } else {
      setPos({ top: undefined, bottom: vh - rect.top + MARGIN, left });
    }
    setReady(true);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: globalThis.MouseEvent) => {
      const pop = document.getElementById('date-input-popup');
      const target = e.target as Node | null;
      if (pop && target && pop.contains(target)) return;
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

  const formatted =
    value && format === 'es'
      ? value.toLocaleDateString('es', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      : value
        ? value.toISOString().slice(0, 10)
        : '';

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
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex h-9 w-full items-center gap-2 rounded-md px-3 text-[12.5px] outline-none transition-colors',
          hasError
            ? 'bg-danger-surface text-danger-text  '
            : 'bg-bg-muted text-fg',
          open && 'ring-2 ring-primary/20'
        )}
      >
        <CalendarIcon
          width={14}
          height={14}
          className={cn('shrink-0', hasError ? 'text-danger-text' : 'text-fg-faint')}
        />
        <span className={cn('flex-1 text-left', !value && 'text-fg-faint')}>
          {formatted || placeholder}
        </span>
      </button>

      {hasError ? (
        <p className="mt-1.5 text-[12px] text-danger-text">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[12px] text-fg-subtle">{hint}</p>
      ) : null}

      {open &&
        ready &&
        createPortal(
          <div
            id="date-input-popup"
            ref={popupRef}
            className="fixed z-[100] animate-[fade-in_150ms_ease-out]"
            style={{ top: pos.top, bottom: pos.bottom, left: pos.left }}
          >
            <Calendar
              value={value}
              onChange={(d) => {
                onChange?.(d);
                setOpen(false);
              }}
              minDate={minDate}
              maxDate={maxDate}
              className="shadow-lg"
            />
          </div>,
          document.body
        )}
    </div>
  );
}
