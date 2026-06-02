// EmptyState — estado vacío reutilizable: ícono, título, descripción y acción
// opcional. Para listas/tablas sin datos, resultados de búsqueda vacíos, etc.

import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.js';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 px-6 py-12 text-center',
        className
      )}
    >
      {icon && (
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-bg-muted text-fg-faint">
          {icon}
        </span>
      )}
      <div>
        <p className="text-[14px] font-semibold text-fg">{title}</p>
        {description != null && (
          <p className="mx-auto mt-1 max-w-sm text-[12.5px] text-fg-muted">
            {description}
          </p>
        )}
      </div>
      {action != null && <div className="mt-1">{action}</div>}
    </div>
  );
}
