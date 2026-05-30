import type { CSSProperties } from 'react';
import { cn } from '../../lib/cn.js';

export type SkeletonVariant = 'rect' | 'circle' | 'text';

export interface SkeletonProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  className?: string;
  style?: CSSProperties;
}

/**
 * Placeholder con shimmer mientras carga contenido.
 */
export default function Skeleton({
  variant = 'rect',
  width,
  height,
  className,
  style
}: SkeletonProps) {
  return (
    <span
      style={{ width, height, ...style }}
      className={cn(
        'skeleton-shimmer block',
        variant === 'circle' && 'rounded-full',
        variant === 'rect' && 'rounded-md',
        variant === 'text' && 'rounded-sm',
        variant === 'text' && !height && 'h-3',
        className
      )}
    />
  );
}
