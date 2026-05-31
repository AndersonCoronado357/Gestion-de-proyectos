import { cn } from '../../../../shared/lib/cn.js';

export default function SocialButton({ children, icon, className, ...props }) {
  return (
    <button
      type="button"
      className={cn(
        'flex h-10 w-full items-center justify-center gap-2.5 rounded-lg bg-bg-muted',
        'text-[13px] font-medium text-fg shadow-sm outline-none transition-all duration-150',
        'hover:shadow-md hover:brightness-95',
        'active:scale-[0.99]',
        className
      )}
      {...props}
    >
      {icon ? <span className="shrink-0">{icon}</span> : null}
      {children}
    </button>
  );
}
