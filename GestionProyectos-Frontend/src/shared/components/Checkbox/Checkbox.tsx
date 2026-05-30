// Checkbox — el componente global de la app.
//
// Dos variantes visuales según el contexto:
//   - 'inline' (default):  caja chica al lado del label.  Ideal para
//                          forms tipo "Recordar sesión".
//   - 'card':              contenedor bordeado con checkbox + label +
//                          descripción.  Ideal para listas de opciones
//                          seleccionables con contexto.
//
// API estable: `checked`, `onChange(next)`, `label`, `description`,
// `disabled`, `variant`.  Sin hacks de focus/aria por consumidor.

import type { ReactNode } from 'react';
import { cn } from '../../lib/cn.js';
import { CheckIcon } from '../icons/index.js';

export type CheckboxVariant = 'inline' | 'card';

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  variant?: CheckboxVariant;
  className?: string;
}

// ── Caja con el ícono animado ────────────────────────────────────────
// Subcomponente interno reusado por ambas variantes.

function CheckBox({
  checked,
  size = 18
}: {
  checked: boolean;
  size?: number;
}) {
  return (
    <span
      aria-hidden="true"
      style={{ height: size, width: size }}
      className={cn(
        'relative flex shrink-0 items-center justify-center rounded-md border transition-all duration-200',
        checked
          ? 'border-primary bg-primary'
          : 'border-border bg-bg group-hover:border-primary-400'
      )}
    >
      <CheckIcon
        width={Math.round(size * 0.66)}
        height={Math.round(size * 0.66)}
        strokeWidth={3}
        className={cn(
          'text-on-primary transition-all duration-200 ease-out',
          checked
            ? 'opacity-100 scale-100 rotate-0'
            : 'opacity-0 scale-50 -rotate-45'
        )}
      />
    </span>
  );
}

// ── Componente principal ─────────────────────────────────────────────

export default function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  variant = 'inline',
  className
}: CheckboxProps) {
  const handleToggle = () => {
    if (disabled) return;
    onChange(!checked);
  };

  if (variant === 'card') {
    return (
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          'group flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left outline-none transition-all duration-200',
          checked
            ? 'border-primary-200 bg-primary-50 dark:border-primary-500/30 dark:bg-primary-500/10'
            : 'border-border-subtle bg-bg hover:border-primary-200 hover:bg-primary-50/40',
          disabled && 'pointer-events-none opacity-60',
          className
        )}
      >
        <CheckBox checked={checked} size={20} />
        <span className="min-w-0 flex-1">
          {label && (
            <span className="block text-[12.5px] font-medium text-fg">
              {label}
            </span>
          )}
          {description && (
            <span className="mt-0.5 block text-[11px] text-fg-faint">
              {description}
            </span>
          )}
        </span>
      </button>
    );
  }

  // 'inline'
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={handleToggle}
      disabled={disabled}
      className={cn(
        'group inline-flex cursor-pointer select-none items-center gap-2 outline-none',
        disabled && 'pointer-events-none opacity-60',
        className
      )}
    >
      <CheckBox checked={checked} size={18} />
      {label && (
        <span className="text-[12.5px] text-fg-muted transition-colors group-hover:text-fg">
          {label}
        </span>
      )}
    </button>
  );
}
