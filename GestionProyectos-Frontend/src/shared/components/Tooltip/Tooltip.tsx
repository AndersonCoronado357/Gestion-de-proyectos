import {
  cloneElement,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  type Ref
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn.js';

const GAP = 8;

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';

interface TooltipPosition {
  top: number;
  left: number;
  side: TooltipSide;
}

// Eventos que se reenvían al hijo después de capturarlos para abrir/cerrar.
interface TriggerEvents {
  onMouseEnter?: (e: MouseEvent<HTMLElement>) => void;
  onMouseLeave?: (e: MouseEvent<HTMLElement>) => void;
  onFocus?: (e: FocusEvent<HTMLElement>) => void;
  onBlur?: (e: FocusEvent<HTMLElement>) => void;
}

export interface TooltipProps {
  content: ReactNode;
  side?: TooltipSide;
  delay?: number;
  children: ReactElement<TriggerEvents & { ref?: Ref<HTMLElement> }>;
}

export default function Tooltip({
  content,
  side = 'top',
  delay = 200,
  children
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [pos, setPos] = useState<TooltipPosition>({ top: 0, left: 0, side });
  const anchorRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    timerRef.current = setTimeout(() => setOpen(true), delay);
  };
  const hide = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setOpen(false);
    setReady(false);
  };

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      const rect = anchorRef.current?.getBoundingClientRect();
      const tip = tooltipRef.current?.getBoundingClientRect();
      if (!rect || !tip) return;

      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let useSide: TooltipSide = side;
      if (side === 'top' && rect.top - tip.height - GAP < 0) useSide = 'bottom';
      if (side === 'bottom' && rect.bottom + tip.height + GAP > vh) useSide = 'top';
      if (side === 'left' && rect.left - tip.width - GAP < 0) useSide = 'right';
      if (side === 'right' && rect.right + tip.width + GAP > vw) useSide = 'left';

      let top: number;
      let left: number;
      if (useSide === 'top') {
        top = rect.top - tip.height - GAP;
        left = rect.left + rect.width / 2 - tip.width / 2;
      } else if (useSide === 'bottom') {
        top = rect.bottom + GAP;
        left = rect.left + rect.width / 2 - tip.width / 2;
      } else if (useSide === 'left') {
        top = rect.top + rect.height / 2 - tip.height / 2;
        left = rect.left - tip.width - GAP;
      } else {
        top = rect.top + rect.height / 2 - tip.height / 2;
        left = rect.right + GAP;
      }

      left = Math.max(8, Math.min(vw - tip.width - 8, left));
      top = Math.max(8, Math.min(vh - tip.height - 8, top));

      setPos({ top, left, side: useSide });
      setReady(true);
    });
  }, [open, side]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const childRef = (
    children as ReactElement & { ref?: Ref<HTMLElement> }
  ).ref;

  const trigger = cloneElement(children, {
    ref: (node: HTMLElement | null) => {
      anchorRef.current = node;
      if (typeof childRef === 'function') {
        childRef(node);
      } else if (childRef && 'current' in childRef) {
        (childRef as { current: HTMLElement | null }).current = node;
      }
    },
    onMouseEnter: (e: MouseEvent<HTMLElement>) => {
      show();
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: MouseEvent<HTMLElement>) => {
      hide();
      children.props.onMouseLeave?.(e);
    },
    onFocus: (e: FocusEvent<HTMLElement>) => {
      show();
      children.props.onFocus?.(e);
    },
    onBlur: (e: FocusEvent<HTMLElement>) => {
      hide();
      children.props.onBlur?.(e);
    }
  } as Partial<TriggerEvents> & { ref: Ref<HTMLElement> });

  // Flecha simple con border-triangle CSS (no es un cuadrado rotado).
  const arrowCls =
    pos.side === 'top'
      ? 'left-1/2 top-full -translate-x-1/2 border-x-[5px] border-x-transparent border-t-[5px] border-t-primary-100'
      : pos.side === 'bottom'
        ? 'left-1/2 bottom-full -translate-x-1/2 border-x-[5px] border-x-transparent border-b-[5px] border-b-primary-100'
        : pos.side === 'left'
          ? 'top-1/2 left-full -translate-y-1/2 border-y-[5px] border-y-transparent border-l-[5px] border-l-primary-100'
          : 'top-1/2 right-full -translate-y-1/2 border-y-[5px] border-y-transparent border-r-[5px] border-r-primary-100';

  return (
    <>
      {trigger}
      {open &&
        createPortal(
          <div
            ref={tooltipRef}
            role="tooltip"
            className={cn(
              'pointer-events-none fixed z-[10000] max-w-[240px] rounded-md bg-primary-100 px-3 py-1.5 text-[12px] font-semibold leading-snug text-primary-700 shadow-lg',
              'transition-[opacity,transform] duration-150',
              ready ? 'opacity-100 scale-100' : 'scale-95 opacity-0'
            )}
            style={{ top: pos.top, left: pos.left }}
          >
            {content}
            <span
              aria-hidden="true"
              className={cn('absolute h-0 w-0', arrowCls)}
            />
          </div>,
          document.body
        )}
    </>
  );
}
