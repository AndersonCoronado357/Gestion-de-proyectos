import { useMemo, useState } from 'react';
import { cn } from '../../lib/cn.js';
import { ChevronRightIcon } from '../../icons/index.js';

const WEEKDAYS_ES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'] as const;
const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
] as const;

function ymd(d: Date | null | undefined): string {
  return d
    ? `${d.getFullYear()}-${String(d.getMonth()).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    : '';
}

interface DayCell {
  date: Date;
  outside: boolean;
}

export interface CalendarProps {
  value?: Date | null;
  onChange?: (date: Date) => void;
  minDate?: Date | null;
  maxDate?: Date | null;
  className?: string;
}

export default function Calendar({
  value,
  onChange,
  minDate,
  maxDate,
  className
}: CalendarProps) {
  const today = useMemo(() => new Date(), []);
  const [view, setView] = useState<Date>(() => value ?? today);

  const year = view.getFullYear();
  const monthIdx = view.getMonth();

  const days: DayCell[] = useMemo(() => {
    const firstDay = new Date(year, monthIdx, 1);
    const lastDay = new Date(year, monthIdx + 1, 0);
    const startWeekday = (firstDay.getDay() + 6) % 7;
    const daysInMonth = lastDay.getDate();

    const out: DayCell[] = [];
    for (let i = startWeekday; i > 0; i--) {
      out.push({ date: new Date(year, monthIdx, 1 - i), outside: true });
    }
    for (let i = 1; i <= daysInMonth; i++) {
      out.push({ date: new Date(year, monthIdx, i), outside: false });
    }
    while (out.length % 7 !== 0) {
      const idx = out.length - daysInMonth - startWeekday + 1;
      out.push({ date: new Date(year, monthIdx + 1, idx), outside: true });
    }
    return out;
  }, [year, monthIdx]);

  const isSame = (a: Date | null | undefined, b: Date | null | undefined) =>
    !!a && !!b && ymd(a) === ymd(b);

  const isDisabled = (d: Date): boolean => {
    if (minDate && d < new Date(minDate.toDateString())) return true;
    if (maxDate && d > new Date(maxDate.toDateString())) return true;
    return false;
  };

  const changeMonth = (delta: number) => {
    setView(new Date(year, monthIdx + delta, 1));
  };

  const reset = () => {
    setView(today);
    onChange?.(today);
  };

  return (
    <div
      className={cn(
        'w-[280px] rounded-lg bg-bg p-3 ring-1 ring-border-subtle',
        className
      )}
    >
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => changeMonth(-1)}
          aria-label="Mes anterior"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-muted outline-none transition-colors hover:bg-bg-muted hover:text-fg"
        >
          <ChevronRightIcon width={13} height={13} className="rotate-180" />
        </button>
        <button
          type="button"
          onClick={reset}
          title="Ir a hoy"
          className="text-[12.5px] font-semibold capitalize text-fg outline-none hover:text-primary-700"
        >
          {MONTHS_ES[monthIdx]} {year}
        </button>
        <button
          type="button"
          onClick={() => changeMonth(1)}
          aria-label="Mes siguiente"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-muted outline-none transition-colors hover:bg-bg-muted hover:text-fg"
        >
          <ChevronRightIcon width={13} height={13} />
        </button>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS_ES.map((d) => (
          <span
            key={d}
            className="flex h-7 items-center justify-center text-[10px] font-semibold uppercase tracking-wider text-fg-faint"
          >
            {d}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const selected = isSame(d.date, value);
          const isToday = isSame(d.date, today);
          const disabled = isDisabled(d.date);
          return (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onChange?.(d.date)}
              className={cn(
                'flex h-8 w-full items-center justify-center rounded-md text-[12px] outline-none transition-colors',
                disabled && 'cursor-not-allowed opacity-30',
                d.outside && !selected && 'text-fg-faint',
                !d.outside && !selected && 'text-fg hover:bg-primary-50 hover:text-primary-700',
                selected && 'bg-primary font-semibold text-on-primary',
                !selected && isToday && 'ring-1 ring-primary'
              )}
            >
              {d.date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
