// EXCEPCIÓN A LA REGLA "todos los iconos en BD": los iconos de Alert
// llevan animación de trazo (`pathLength` + `icon-draw` + delay) que
// requiere control fino de los paths individuales. El renderizado por
// dangerouslySetInnerHTML del componente <Icon> no permite eso. Son los
// 4 únicos iconos siempre fijos del set (success/error/warning/confirm),
// no cambian nunca, así que se quedan inline.

import type { CSSProperties, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn.js';

export type AlertType = 'success' | 'error' | 'warning' | 'confirm';

interface AlertTypeMeta {
  title: string;
  confirmText: string;
  iconBg: string;
  btn: string;
  icon: ReactNode;
}

const drawStyle = (delayMs: number): CSSProperties => ({
  animationDelay: `${delayMs}ms`
});

const TYPES: Record<AlertType, AlertTypeMeta> = {
  success: {
    title: '¡Éxito!',
    confirmText: 'CONTINUAR',
    iconBg: 'bg-primary',
    btn: 'bg-primary hover:bg-primary-700',
    icon: (
      <svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" pathLength={1} className="icon-draw" style={drawStyle(150)} />
      </svg>
    )
  },
  error: {
    title: 'Error',
    confirmText: 'INTENTAR DE NUEVO',
    iconBg: 'bg-danger',
    btn: 'bg-danger hover:bg-danger-hover',
    icon: (
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 6 6 18" pathLength={1} className="icon-draw" style={drawStyle(150)} />
        <path d="m6 6 12 12" pathLength={1} className="icon-draw" style={drawStyle(300)} />
      </svg>
    )
  },
  warning: {
    title: 'Advertencia',
    confirmText: 'REVISAR',
    iconBg: 'bg-warning',
    btn: 'bg-warning hover:bg-warning-hover',
    icon: (
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
          pathLength={1}
          className="icon-draw"
          style={drawStyle(150)}
        />
        <path d="M12 9v4" pathLength={1} className="icon-draw" style={drawStyle(450)} />
        <path d="M12 17h.01" pathLength={1} className="icon-draw" style={drawStyle(600)} />
      </svg>
    )
  },
  confirm: {
    title: 'Confirmar',
    confirmText: 'CONFIRMAR',
    iconBg: 'bg-primary',
    btn: 'bg-primary hover:bg-primary-700',
    icon: (
      <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <circle cx={12} cy={12} r={10} pathLength={1} className="icon-draw" style={drawStyle(150)} />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" pathLength={1} className="icon-draw" style={drawStyle(450)} />
        <path d="M12 17h.01" pathLength={1} className="icon-draw" style={drawStyle(650)} />
      </svg>
    )
  }
};

const BTN_BASE =
  'rounded-full px-4 py-2 text-[12.5px] font-semibold uppercase tracking-wide transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0';
const CANCEL_BTN =
  'border-2 border-primary bg-transparent text-primary hover:bg-primary hover:text-on-primary';
const SOLID_TEXT = 'text-white';

export interface AlertProps {
  type?: AlertType;
  title?: ReactNode;
  message?: ReactNode;
  confirmText?: ReactNode;
  cancelText?: ReactNode;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

export default function Alert({
  type = 'success',
  title,
  message,
  confirmText,
  cancelText = 'CANCELAR',
  onConfirm,
  onCancel,
  onClose
}: AlertProps) {
  const meta = TYPES[type] ?? TYPES.success;
  const isConfirm = type === 'confirm' || !!onCancel;

  return createPortal(
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 px-6 animate-[fade-in_300ms_ease] dark:bg-black/60"
      onClick={onClose}
    >
      <div
        className={cn(
          'relative flex w-[320px] flex-col items-center',
          'rounded-2xl bg-bg dark:bg-bg-muted px-6 pt-[58px] pb-7 text-center shadow-2xl',
          'ring-1 ring-black/5 dark:ring-1 dark:ring-white/15',
          'animate-[alert-bounce-in_500ms_cubic-bezier(0.68,-0.55,0.265,1.55)_forwards]'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className={cn(
            'absolute left-1/2 top-0 flex h-[62px] w-[62px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-md',
            meta.iconBg
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              'absolute -inset-1.5 rounded-full opacity-30 animate-[alert-pulse-ring_0.8s_ease-out_forwards]',
              meta.iconBg
            )}
          />
          <span className="relative">{meta.icon}</span>
        </span>

        <h3 className="text-[20px] font-bold leading-tight tracking-tight text-fg animate-[alert-slide-in-down_500ms_ease_0.4s_both]">
          {title ?? meta.title}
        </h3>

        {message && (
          <p
            className="mt-2 text-[15px] leading-relaxed text-fg-muted animate-[alert-fade-in-up_500ms_ease_0.5s_both]"
            style={{ textWrap: 'balance' } as CSSProperties}
          >
            {message}
          </p>
        )}

        <div
          className={cn(
            'mt-5 flex w-full gap-2 animate-[alert-fade-in-up_500ms_ease_0.6s_both]',
            isConfirm ? 'flex-row' : 'flex-col'
          )}
        >
          {isConfirm && (
            <button
              type="button"
              onClick={onCancel ?? onClose}
              className={cn(BTN_BASE, CANCEL_BTN, 'flex-1')}
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm ?? onClose}
            className={cn(BTN_BASE, SOLID_TEXT, meta.btn, isConfirm ? 'flex-1' : 'w-full')}
          >
            {confirmText ?? meta.confirmText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
