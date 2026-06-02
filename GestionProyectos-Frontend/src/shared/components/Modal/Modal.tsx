// Modal / Dialog — diálogo centrado en un portal. Cierra con Escape, click en
// el backdrop o el botón ✕. Reutilizable para confirmaciones, formularios, etc.

import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn.js';

export type ModalSize = 'sm' | 'md' | 'lg';

const SIZES: Record<ModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl'
};

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  size?: ModalSize;
  className?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  className
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/40 p-4 animate-[fade-in_150ms_ease] dark:bg-black/60"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full overflow-hidden rounded-2xl bg-bg shadow-2xl animate-[pop-in_180ms_ease] dark:ring-1 dark:ring-white/10',
          SIZES[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title != null && (
          <div className="flex items-center justify-between gap-3 border-b border-border-subtle px-5 py-3.5">
            <h3 className="text-[15px] font-semibold text-fg">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-fg-faint outline-none transition-colors hover:bg-bg-muted hover:text-fg"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                className="h-4 w-4"
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        )}
        <div className="px-5 py-4 text-[13px] leading-relaxed text-fg-muted">
          {children}
        </div>
        {footer != null && (
          <div className="flex justify-end gap-2 border-t border-border-subtle px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
