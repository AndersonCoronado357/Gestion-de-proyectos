import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.js';

export type ProgressBarVariant = 'primary' | 'success' | 'warning' | 'danger';
export type ProgressBarSize = 'sm' | 'md';

// Success usa primary para adaptarse al color elegido por el usuario.
const VARIANTS: Record<ProgressBarVariant, string> = {
  primary: 'bg-primary',
  success: 'bg-primary',
  warning: 'bg-warning',
  danger: 'bg-danger'
};

const SIZES: Record<ProgressBarSize, string> = {
  sm: 'h-1',
  md: 'h-2'
};

export interface ProgressBarProps {
  value?: number;
  showLabel?: boolean;
  variant?: ProgressBarVariant;
  size?: ProgressBarSize;
  label?: ReactNode;
  indeterminate?: boolean;
  className?: string;
}

/**
 * Barra de progreso lineal.
 *
 *  - `indeterminate`: ignora `value` y muestra animación de carga continua.
 *  - `value`: 0..100 cuando es determinada.
 */
export default function ProgressBar({
  value = 0,
  showLabel = false,
  variant = 'primary',
  size = 'md',
  label,
  indeterminate = false,
  className
}: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className={cn('w-full', className)}>
      {(showLabel || label) && !indeterminate && (
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-fg-muted">
          <span>{label ?? 'Progreso'}</span>
          <span className="font-mono tabular-nums">{Math.round(clamped)}%</span>
        </div>
      )}
      {indeterminate && label && (
        <div className="mb-1.5 text-[11px] text-fg-muted">{label}</div>
      )}

      <div
        className={cn(
          'relative w-full overflow-hidden rounded-full bg-bg-muted',
          SIZES[size]
        )}
      >
        {indeterminate ? (
          <span
            aria-hidden="true"
            className={cn('absolute inset-0 rounded-full', VARIANTS[variant])}
            style={{ animation: 'loading-bar-indeterminate 1.6s linear infinite' }}
          />
        ) : (
          <div
            className={cn(
              'h-full rounded-full transition-[width] duration-300 ease-out',
              VARIANTS[variant]
            )}
            style={{ width: `${clamped}%` }}
          />
        )}
      </div>
    </div>
  );
}
