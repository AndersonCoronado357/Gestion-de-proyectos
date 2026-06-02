// StatCard — tarjeta de KPI/métrica: etiqueta, valor grande, variación
// (▲/▼) e ícono opcional. Reutilizable en cualquier dashboard.

import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.js';

export interface StatCardProps {
  label: ReactNode;
  value: ReactNode;
  /** Variación porcentual (positiva = verde ▲, negativa = rojo ▼). */
  delta?: number;
  deltaSuffix?: string;
  icon?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export default function StatCard({
  label,
  value,
  delta,
  deltaSuffix = '%',
  icon,
  footer,
  className
}: StatCardProps) {
  const up = delta != null && delta >= 0;
  return (
    <div className={cn('rounded-xl bg-bg p-4 shadow-sm', className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[11px] font-medium uppercase tracking-wider text-fg-faint">
            {label}
          </p>
          <p className="mt-1.5 text-[24px] font-bold leading-none tracking-tight text-fg">
            {value}
          </p>
        </div>
        {icon && (
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary dark:bg-primary-500/15">
            {icon}
          </span>
        )}
      </div>
      {(delta != null || footer != null) && (
        <div className="mt-3 flex items-center gap-2 text-[11.5px]">
          {delta != null && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-semibold',
                up
                  ? 'bg-success-surface text-success-text'
                  : 'bg-danger-surface text-danger-text'
              )}
            >
              {up ? '▲' : '▼'} {Math.abs(delta)}
              {deltaSuffix}
            </span>
          )}
          {footer != null && <span className="min-w-0 truncate text-fg-faint">{footer}</span>}
        </div>
      )}
    </div>
  );
}
