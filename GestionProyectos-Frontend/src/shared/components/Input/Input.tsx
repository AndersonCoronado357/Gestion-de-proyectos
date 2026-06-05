import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode
} from 'react';
import { cn } from '../../lib/cn.js';
import { EyeIcon, EyeOffIcon } from '../../icons/index.js';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    leftIcon,
    rightIcon,
    className,
    id,
    type = 'text',
    // Por default sin sugerencias del navegador. Las pantallas que
    // necesitan autocompletado semántico (login, register, etc.) lo
    // sobreescriben pasando `autoComplete="username"` u otro valor.
    autoComplete = 'off',
    ...props
  },
  ref
) {
  const reactId = useId();
  const inputId = id || reactId;
  const hasError = !!error;
  const isPassword = type === 'password';
  const [showPass, setShowPass] = useState(false);
  const actualType = isPassword ? (showPass ? 'text' : 'password') : type;

  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={inputId}
          className="mb-1.5 block text-[12.5px] font-medium text-fg-muted"
        >
          {label}
        </label>
      ) : null}

      <div className="relative">
        {leftIcon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint">
            {leftIcon}
          </span>
        ) : null}

        <input
          ref={ref}
          id={inputId}
          type={actualType}
          autoComplete={autoComplete}
          aria-invalid={hasError || undefined}
          className={cn(
            'h-9 w-full rounded-md text-[12.5px] outline-none transition-colors',
            'border-0',
            leftIcon ? 'pl-9' : 'pl-3',
            isPassword || rightIcon ? 'pr-9' : 'pr-3',
            hasError
              ? 'bg-danger-surface text-danger-text placeholder:text-danger-text/50   '
              : 'bg-bg-muted text-fg placeholder:text-fg-faint',
            className
          )}
          {...props}
        />

        {/* Ojito automático en inputs de contraseña */}
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShowPass((v) => !v)}
            tabIndex={-1}
            title={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-faint outline-none transition-colors hover:bg-bg hover:text-fg"
          >
            {showPass ? (
              <EyeOffIcon width={14} height={14} />
            ) : (
              <EyeIcon width={14} height={14} />
            )}
          </button>
        ) : rightIcon ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-fg-faint">
            {rightIcon}
          </span>
        ) : null}
      </div>

      {hasError ? (
        <p className="mt-1.5 text-[12px] text-danger-text">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-[12px] text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
});

export default Input;
