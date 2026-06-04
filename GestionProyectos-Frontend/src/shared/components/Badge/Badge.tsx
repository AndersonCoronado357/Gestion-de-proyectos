// Badge / Chip — etiqueta compacta de estado o conteo. Usa los tokens
// semánticos del tema (se adapta a accent + modo oscuro).

import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.js';

export type BadgeVariant =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger';
export type BadgeSize = 'sm' | 'md';

const VARIANTS: Record<BadgeVariant, string> = {
  neutral: 'bg-bg-muted text-fg-muted',
  // En oscuro: primary-700/35 sobre fondo oscuro pinta un azul claro
  // claramente distinguible (antes 500/15 quedaba casi invisible), y el
  // texto va con primary-800 (shade claro en oscuro) para mantener contraste.
  primary:
    'bg-primary-50 text-primary dark:bg-primary-700/35 dark:text-primary-800',
  success: 'bg-success-surface text-success-text',
  warning: 'bg-warning-surface text-warning-text',
  danger: 'bg-danger-surface text-danger-text'
};

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  /** Muestra un puntito a la izquierda. */
  dot?: boolean;
  className?: string;
}

export default function Badge({
  children,
  variant = 'neutral',
  size = 'md',
  dot = false,
  className
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[10.5px]' : 'px-2.5 py-1 text-[11.5px]',
        VARIANTS[variant],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}
