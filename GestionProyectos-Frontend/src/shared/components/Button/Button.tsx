import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ReactNode
} from 'react';
import { cn } from '../../lib/cn.js';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'warning'
  | 'outline-primary'
  | 'outline-success'
  | 'outline-danger'
  | 'outline-warning';

export type ButtonSize = 'sm' | 'md' | 'lg';

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-on-primary hover:bg-primary-700 active:bg-primary-800 focus-visible:ring-primary/30',
  secondary:
    'bg-bg text-fg border border-border hover:bg-bg-muted focus-visible:ring-fg-faint/40',
  ghost:
    'bg-transparent text-fg-muted hover:bg-surface-hover hover:text-fg focus-visible:ring-fg-faint/40',
  danger:
    'bg-danger text-white hover:bg-danger-hover active:bg-danger-hover focus-visible:ring-danger/30',
  // Success usa el color primary del tema: si el usuario cambia el primary
  // en Settings, success se adapta automáticamente.
  success:
    'bg-primary text-on-primary hover:bg-primary-700 active:bg-primary-800 focus-visible:ring-primary/30',
  warning:
    'bg-warning text-white hover:bg-warning-hover active:bg-warning-hover focus-visible:ring-warning/30',

  // Outline: borde, texto y fill en hover usan EXACTAMENTE el mismo color.
  'outline-primary':
    'border-2 border-primary bg-transparent font-semibold text-primary hover:bg-primary hover:text-on-primary focus-visible:ring-primary/30',
  'outline-success':
    'border-2 border-primary bg-transparent font-semibold text-primary hover:bg-primary hover:text-on-primary focus-visible:ring-primary/30',
  'outline-danger':
    'border-2 border-danger bg-transparent font-semibold text-danger-text hover:bg-danger hover:text-white focus-visible:ring-danger/30',
  'outline-warning':
    'border-2 border-warning bg-transparent font-semibold text-warning-text hover:bg-warning hover:text-white focus-visible:ring-warning/30'
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[12.5px] gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
  lg: 'h-11 px-5 text-[15px] gap-2'
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    className,
    leftIcon,
    rightIcon,
    fullWidth,
    children,
    type = 'button',
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium',
        'transition-colors duration-150 outline-none',
        'focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-bg',
        'disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {leftIcon ? <span className="shrink-0">{leftIcon}</span> : null}
      {children}
      {rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
    </button>
  );
});

export default Button;
