import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn.js';

export type ToastType = 'success' | 'error' | 'warning';
export type ToastPosition = 'top-right' | 'bottom-right';

export interface ToastOptions {
  title?: ReactNode;
  message?: ReactNode;
  duration?: number;
}

export interface ToastItem extends ToastOptions {
  id: number;
  type: ToastType;
}

export interface ToastApi {
  success: (opts?: ToastOptions) => number;
  error: (opts?: ToastOptions) => number;
  warning: (opts?: ToastOptions) => number;
  close: (id: number) => void;
  setPosition: (pos: ToastPosition) => void;
  position: ToastPosition;
}

interface ToastTypeMeta {
  bar: string;
  iconColor: string;
  icon: ReactNode;
}

const ds = (delayMs: number): CSSProperties => ({
  animationDelay: `${delayMs}ms`
});

const TYPES: Record<ToastType, ToastTypeMeta> = {
  success: {
    bar: 'bg-primary',
    iconColor: 'text-primary',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" width={28} height={28}>
        <circle cx={12} cy={12} r={10} pathLength={1} className="icon-draw" style={ds(150)} />
        <path d="m8 12.5 3 3 5.5-7" pathLength={1} className="icon-draw" style={ds(400)} />
      </svg>
    )
  },
  error: {
    bar: 'bg-red-600',
    iconColor: 'text-red-600',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" width={28} height={28}>
        <circle cx={12} cy={12} r={10} pathLength={1} className="icon-draw" style={ds(150)} />
        <path d="M15 9 9 15" pathLength={1} className="icon-draw" style={ds(400)} />
        <path d="m9 9 6 6" pathLength={1} className="icon-draw" style={ds(550)} />
      </svg>
    )
  },
  warning: {
    bar: 'bg-amber-500',
    iconColor: 'text-amber-500',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" width={28} height={28}>
        <circle cx={12} cy={12} r={10} pathLength={1} className="icon-draw" style={ds(150)} />
        <path d="M12 7v6" pathLength={1} className="icon-draw" style={ds(400)} />
        <path d="M12 17h.01" pathLength={1} className="icon-draw" style={ds(600)} />
      </svg>
    )
  }
};

const POSITIONS: Record<ToastPosition, string> = {
  'top-right': 'top-16 left-3 right-3 sm:left-auto sm:right-5 flex-col',
  'bottom-right': 'bottom-3 left-3 right-3 sm:left-auto sm:right-5 sm:bottom-5 flex-col-reverse'
};

const ToastContext = createContext<ToastApi | null>(null);

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>');
  return ctx;
}

interface ToastItemViewProps {
  toast: ToastItem;
  onClose: (id: number) => void;
}

function ToastItemView({ toast, onClose }: ToastItemViewProps) {
  const meta = TYPES[toast.type] ?? TYPES.success;
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!toast.duration) return;
    const t = setTimeout(() => {
      setLeaving(true);
      setTimeout(() => onClose(toast.id), 220);
    }, toast.duration);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, onClose]);

  return (
    <div
      role="status"
      className={cn(
        'pointer-events-auto relative grid h-[60px] w-full items-center overflow-hidden rounded-[8px] bg-bg px-3 shadow-[0_10px_25px_rgba(0,0,0,0.08)] sm:w-[340px]',
        leaving
          ? 'animate-[toast-slide-out_200ms_ease-in_forwards]'
          : 'animate-[toast-slide-in_280ms_cubic-bezier(0.4,0,0.2,1)_forwards]'
      )}
      style={{ gridTemplateColumns: '44px 1fr' }}
    >
      <span
        aria-hidden="true"
        className={cn('absolute left-0 top-0 h-full w-[6px]', meta.bar)}
      />

      <span className={cn('flex items-center justify-center', meta.iconColor)}>
        {meta.icon}
      </span>

      <div className="min-w-0">
        {toast.title && (
          <p className="text-[14px] font-semibold leading-tight text-fg">
            {toast.title}
          </p>
        )}
        {toast.message && (
          <p
            className={cn(
              'text-[12px] font-normal leading-snug text-fg-subtle',
              toast.title && 'mt-1'
            )}
          >
            {toast.message}
          </p>
        )}
      </div>
    </div>
  );
}

export interface ToastProviderProps {
  children: ReactNode;
  position?: ToastPosition;
}

export function ToastProvider({
  children,
  position: defaultPosition = 'top-right'
}: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [position, setPosition] = useState<ToastPosition>(defaultPosition);
  const idRef = useRef(0);

  const close = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast: ToastOptions & { type: ToastType }) => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { duration: 4500, ...toast, id }]);
      return id;
    },
    []
  );

  const api: ToastApi = {
    success: (opts = {}) => push({ ...opts, type: 'success' }),
    error: (opts = {}) => push({ ...opts, type: 'error' }),
    warning: (opts = {}) => push({ ...opts, type: 'warning' }),
    setPosition,
    position,
    close
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div
          className={cn(
            'pointer-events-none fixed z-[9999] flex gap-3',
            POSITIONS[position] ?? POSITIONS['top-right']
          )}
        >
          {toasts.map((t) => (
            <ToastItemView key={t.id} toast={t} onClose={close} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
}
