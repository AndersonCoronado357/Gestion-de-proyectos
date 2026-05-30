// Switch — segmented control con indicador deslizante.
//
// Permite elegir UNA entre varias opciones (típicamente 2–4) con una
// animación de píldora que se mueve y cambia de ancho al cambiar la
// selección.  Usado en la app para cosas como:
//   - Sede:        Medellín / Rionegro
//   - Ambiente:    DEV / QAS / PRD
//   - Vista:       tablero / lista / calendario
//
// Para toggles binarios on/off al estilo iOS, este NO es el componente
// indicado — usá un Checkbox o pedí un Toggle dedicado.

import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.js';

export interface SwitchOption<V extends string> {
  value: V;
  label: string;
}

export interface SwitchProps<V extends string> {
  options: ReadonlyArray<SwitchOption<V>>;
  value: V | '';
  onChange: (v: V) => void;
  label?: ReactNode;
  hint?: ReactNode;
  disabled?: boolean;
  className?: string;
}

export default function Switch<V extends string>({
  options,
  value,
  onChange,
  label,
  hint,
  disabled = false,
  className
}: SwitchProps<V>) {
  const activeIdx = options.findIndex((o) => o.value === value);
  const widthPct = options.length > 0 ? 100 / options.length : 0;

  return (
    <div className={className}>
      {label && (
        <p className="mb-1.5 text-[12.5px] font-medium text-fg-muted">{label}</p>
      )}
      <div
        className={cn(
          'relative flex w-full gap-1 rounded-lg bg-bg-muted p-1',
          disabled && 'pointer-events-none opacity-60'
        )}
      >
        {/* Indicador deslizante: se mueve y cambia ancho al cambiar la
            opción activa. */}
        {activeIdx >= 0 && (
          <span
            aria-hidden="true"
            className="absolute bottom-1 top-1 rounded-md bg-primary shadow-sm transition-all duration-300 ease-out"
            style={{
              left: `calc(${activeIdx * widthPct}% + 4px)`,
              width: `calc(${widthPct}% - 8px)`
            }}
          />
        )}
        {options.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={cn(
                'relative z-10 flex-1 rounded-md py-1.5 text-[12px] font-semibold outline-none transition-colors duration-300',
                active ? 'text-on-primary' : 'text-fg-muted hover:text-fg'
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {hint && <p className="mt-1 text-[11px] text-fg-faint">{hint}</p>}
    </div>
  );
}
