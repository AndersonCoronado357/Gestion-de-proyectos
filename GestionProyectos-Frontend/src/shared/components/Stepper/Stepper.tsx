// Stepper — pasos de un proceso/wizard. `current` marca el paso activo;
// los anteriores quedan como completados (✓).

import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.js';

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
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-full text-[12px] font-semibold transition-colors',
                  done
                    ? 'bg-primary text-on-primary'
                    : active
                      ? 'bg-primary text-on-primary ring-4 ring-primary-50 dark:ring-primary-500/20'
                      : 'bg-bg-muted text-fg-faint'
                )}
              >
                {done ? '✓' : i + 1}
              </span>
              <span
                className={cn(
                  'mt-1.5 max-w-[7rem] text-center text-[11.5px]',
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
              <span
                className={cn(
                  'mx-2 mt-4 h-0.5 flex-1 rounded-full transition-colors',
                  done ? 'bg-primary' : 'bg-bg-muted'
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
