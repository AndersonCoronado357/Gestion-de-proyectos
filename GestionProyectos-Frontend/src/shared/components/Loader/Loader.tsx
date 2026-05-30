import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.js';

export interface LoaderProps {
  overlay?: boolean;
  label?: ReactNode;
  className?: string;
}

/**
 * Spinner de 2 bolitas animadas. Puede ser inline o full-screen overlay.
 */
export default function Loader({
  overlay = false,
  label = null,
  className
}: LoaderProps) {
  const spinner = (
    <div className="inline-flex flex-col items-center gap-3">
      <span className="loader-balls" aria-label="Cargando" />
      {label ? (
        <span className="text-[12px] font-medium text-fg-muted">{label}</span>
      ) : null}
    </div>
  );

  if (!overlay) return <div className={className}>{spinner}</div>;

  return (
    <div
      className={cn(
        'fixed inset-0 z-[9999] flex items-center justify-center',
        'bg-bg/85 backdrop-blur-[2px] animate-[fade-in_180ms_ease-out]',
        className
      )}
    >
      {spinner}
    </div>
  );
}
