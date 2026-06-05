import {
  forwardRef,
  useId,
  type ReactNode,
  type TextareaHTMLAttributes
} from 'react';
import { cn } from '../../lib/cn.js';

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  /** Clases para el `<div>` envoltorio (útil para `flex-1 min-h-0` en
   *  layouts donde el textarea debe ocupar el alto sobrante). */
  wrapperClassName?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    {
      label,
      hint,
      error,
      rows = 4,
      className,
      wrapperClassName,
      id,
      // Sin sugerencias del navegador por default.
      autoComplete = 'off',
      ...props
    },
    ref
  ) {
    const reactId = useId();
    const tId = id || reactId;
    const hasError = !!error;

    return (
      <div className={cn('w-full', wrapperClassName)}>
        {label ? (
          <label
            htmlFor={tId}
            className="mb-1.5 block text-[12.5px] font-medium text-fg-muted"
          >
            {label}
          </label>
        ) : null}

        <textarea
          ref={ref}
          id={tId}
          rows={rows}
          autoComplete={autoComplete}
          aria-invalid={hasError || undefined}
          className={cn(
            // Sin resize manual por defecto (sin el "agarrador" en la esquina).
            // Si el caller lo quiere, puede pasar `resize-y` en className.
            'w-full resize-none rounded-md bg-bg-muted px-3 py-2 text-[12.5px] text-fg placeholder:text-fg-faint',
            'border-0 outline-none transition-colors',
            className
          )}
          {...props}
        />

        {hasError ? (
          <p className="mt-1.5 text-[12px] text-danger-text">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-[12px] text-fg-subtle">{hint}</p>
        ) : null}
      </div>
    );
  }
);

export default Textarea;
