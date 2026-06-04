// Stepper — pasos de un proceso/wizard. `current` marca el paso activo;
// los anteriores quedan como completados (✓).

import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.js';
import { CheckCircleIcon } from '../../icons/index.js';

export interface Step {
  label: ReactNode;
  description?: ReactNode;
}

export interface StepperProps {
  steps: Step[];
  current?: number;
  className?: string;
}

export default function Stepper({ steps, current = 0, className }: StepperProps) {
  return (
    <ol className={cn('flex w-full items-start', className)}>
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const last = i === steps.length - 1;
        return (
          <li key={i} className={cn('flex items-start', !last && 'flex-1')}>
            <div className="flex flex-col items-center">
              {/* Círculo del paso. Done = sin relleno, sólo el icono check-
                  circle outline en color primary. Active = relleno + ring.
                  Pending = gris con número. Transiciones suaves de color. */}
              <span
                className={cn(
                  'relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ease-out',
                  done || active
                    ? 'bg-primary text-on-primary'
                    : 'bg-bg-muted text-fg-faint',
                  active && 'ring-4 ring-primary-50 dark:ring-primary-500/20'
                )}
              >
                {/* Número (visible cuando NO está done; sale con scale + fade). */}
                <span
                  className={cn(
                    'absolute inset-0 flex items-center justify-center text-[12px] font-semibold transition-all duration-300 ease-out',
                    done ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                  )}
                >
                  {i + 1}
                </span>
                {/* Check-circle outline desde la BD de iconos. Aparece con
                    scale-up cuando el paso se completa. */}
                <CheckCircleIcon
                  width={20}
                  height={20}
                  className={cn(
                    'transition-all duration-300 ease-out',
                    done ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                  )}
                />
              </span>
              <span
                className={cn(
                  'mt-1.5 max-w-[7rem] text-center text-[11.5px] transition-colors duration-300',
                  active || done ? 'font-medium text-fg' : 'text-fg-muted'
                )}
              >
                {s.label}
              </span>
              {s.description != null && (
                <span className="max-w-[7rem] text-center text-[10.5px] text-fg-faint">
                  {s.description}
                </span>
              )}
            </div>
            {!last && (
              <span className="mx-2 mt-4 h-0.5 flex-1 overflow-hidden rounded-full bg-bg-muted">
                {/* Fill interno con scale-x → la barra se "llena" suavemente
                    cuando el paso se completa. */}
                <span
                  className={cn(
                    'block h-full origin-left rounded-full bg-primary transition-transform duration-500 ease-out',
                    done ? 'scale-x-100' : 'scale-x-0'
                  )}
                />
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
