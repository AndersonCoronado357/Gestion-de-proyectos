// TagChip — chip de texto neutro para taxonomías sin severidad (origen,
// categoría, módulo, etc.). Mismo look del Badge `neutral` pero con un
// helper para mostrar valores en MAYÚSCULAS / camelCase consistentes.

import Badge, { type BadgeSize } from '../Badge/index.js';

export interface TagChipProps {
  /** Texto del chip. Se respeta tal cual viene. */
  children: string;
  /** Si true, lo muestra en MAYÚSCULAS con tracking-wider (estilo "código"). */
  uppercase?: boolean;
  size?: BadgeSize;
  className?: string;
}

export default function TagChip({
  children,
  uppercase = false,
  size = 'sm',
  className
}: TagChipProps) {
  return (
    <Badge
      variant="neutral"
      size={size}
      className={
        uppercase
          ? `font-mono uppercase tracking-wider ${className ?? ''}`
          : className
      }
    >
      {children}
    </Badge>
  );
}
