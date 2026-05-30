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
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { label, hint, error, rows = 4, className, id, ...props },
    ref
  ) {
    const reactId = useId();
    const tId = id || reactId;
    const hasError = !!error;

    return (
      <div className="w-full">
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
          aria-invalid={hasError || undefined}
          className={cn(
            'w-full resize-y rounded-md bg-bg-muted px-3 py-2 text-[12.5px] text-fg placeholder:text-fg-faint',
            'border-0 outline-none transition-colors',
            className
          )}
          {...props}
        />

        {hasError ? (
          <p className="mt-1.5 text-[12px] text-red-600 dark:text-red-400">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-[12px] text-fg-subtle">{hint}</p>
        ) : null}
      </div>
    );
  }
);

export default Textarea;
