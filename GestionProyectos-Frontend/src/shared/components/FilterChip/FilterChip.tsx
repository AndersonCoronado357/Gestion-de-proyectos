// FilterChip — chip interactivo (toggleable) para filtros rápidos.
//
// A diferencia del Badge/LevelChip (puramente decorativos), éste tiene
// estado activo/inactivo, hover y foco accesibles. Pensado para tiras de
// chips tipo "Filtrar por: [Error] [Advertencia] [Info]" donde el usuario
// puede activar varias a la vez.
//
// El color sigue los tokens semánticos del Badge:
//   - default: primary  (filtro genérico)
//   - level → variantes equivalentes a LevelChip
//
// Variantes adicionales (pasadas por prop) para reusar en cualquier dominio.

import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.js';

export type FilterChipVariant =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger';

const ACTIVE: Record<FilterChipVariant, string> = {
  neutral: 'bg-bg-muted text-fg border-transparent',
  primary: 'bg-primary text-on-primary border-transparent',
  success: 'bg-success-surface text-success-text border-transparent',
  warning: 'bg-warning-surface text-warning-text border-transparent',
  danger: 'bg-danger-surface text-danger-text border-transparent'
};

const INACTIVE: Record<FilterChipVariant, string> = {
  neutral: 'bg-bg-muted text-fg-muted border-transparent hover:bg-bg-muted/70',
  primary: 'bg-bg-muted text-fg-muted border-transparent hover:bg-primary-50 hover:text-primary dark:hover:bg-primary-500/15',
  success: 'bg-bg-muted text-fg-muted border-transparent hover:bg-success-surface hover:text-success-text',
  warning: 'bg-bg-muted text-fg-muted border-transparent hover:bg-warning-surface hover:text-warning-text',
  danger: 'bg-bg-muted text-fg-muted border-transparent hover:bg-danger-surface hover:text-danger-text'
};

export interface FilterChipProps {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
  variant?: FilterChipVariant;
  /** Punto del color a la izquierda. */
  dot?: boolean;
  /** Contador a la derecha (ej. "12 errores"). */
  count?: number;
  disabled?: boolean;
  className?: string;
}

export default function FilterChip({
  children,
  active,
  onClick,
  variant = 'primary',
  dot = false,
  count,
  disabled = false,
  className
}: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium outline-none',
        // Animación SUTIL: sólo colores con un easing suave. Sin transform,
        // sin shadow, sin saltos. Limpio.
        'transition-colors duration-200 ease-out',
        'focus-visible:ring-2 focus-visible:ring-primary/40',
        active ? ACTIVE[variant] : INACTIVE[variant],
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            active ? 'bg-current opacity-80' : 'bg-current opacity-50'
          )}
        />
      )}
      <span>{children}</span>
      {count != null && (
        <span
          className={cn(
            'rounded-full px-1.5 text-[10px] font-semibold tabular-nums',
            active ? 'bg-black/15 dark:bg-white/15' : 'bg-bg-muted'
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
