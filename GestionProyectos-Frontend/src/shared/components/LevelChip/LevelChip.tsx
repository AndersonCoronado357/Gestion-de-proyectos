// LevelChip — píldora de "nivel" genérica, reutilizable en cualquier vista
// que necesite mostrar severidad (logs, validaciones, tareas, etc.).
//
// Mapea cada nivel a un `variant` del Badge existente + etiqueta i18n.
// Se monta sobre `Badge`, así que hereda dark mode y tokens semánticos.

import Badge, { type BadgeSize } from '../Badge/index.js';

export type Level =
  | 'error'
  | 'warn'
  | 'info'
  | 'debug'
  | 'audit'
  | 'success';

const VARIANT: Record<
  Level,
  'danger' | 'warning' | 'primary' | 'neutral' | 'success'
> = {
  error: 'danger',
  warn: 'warning',
  info: 'primary',
  debug: 'neutral',
  audit: 'success',
  success: 'success'
};

const LABEL: Record<Level, string> = {
  error: 'Error',
  warn: 'Advertencia',
  info: 'Info',
  debug: 'Debug',
  audit: 'Auditoría',
  success: 'OK'
};

export interface LevelChipProps {
  level: Level;
  /** Etiqueta a mostrar si querés sobreescribir el default. */
  label?: string;
  size?: BadgeSize;
  /** Punto del color a la izquierda. Default true. */
  dot?: boolean;
  className?: string;
}

export default function LevelChip({
  level,
  label,
  size = 'sm',
  dot = true,
  className
}: LevelChipProps) {
  return (
    <Badge variant={VARIANT[level]} size={size} dot={dot} className={className}>
      {label ?? LABEL[level]}
    </Badge>
  );
}
