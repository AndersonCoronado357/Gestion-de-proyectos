import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/cn.js';
import {
  ChevronDownIcon,
  UserCircleIcon,
  LogoutIcon
} from '../../icons/index.js';

export type UserMenuVariant = 'default' | 'on-dark';

export interface UserMenuProps {
  displayName?: string;
  role?: string;
  initials?: string;
  onProfile?: () => void;
  onLogout?: () => void;
  variant?: UserMenuVariant;
}

export default function UserMenu({
  displayName = 'Anderson Coronado',
  role = 'Administrador',
  initials = 'AC',
  onProfile,
  onLogout,
  variant = 'default'
}: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      const target = e.target as Node | null;
      if (ref.current && target && !ref.current.contains(target)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const isDark = variant === 'on-dark';

  const handle = (cb?: () => void) => () => {
    setOpen(false);
    cb?.();
  };

  return (
    <div className="relative shrink-0 md:w-[200px]" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          'flex h-10 w-full items-center gap-2.5 rounded-md px-3 transition-colors outline-none',
          'focus-visible:ring-2 focus-visible:ring-white/30',
          isDark
            ? cn('text-white hover:bg-white/[0.10]', open && 'bg-white/[0.13]')
            : cn('hover:bg-surface-hover', open && 'bg-surface-hover')
        )}
      >
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11.5px] font-semibold',
            isDark ? 'bg-white/20 text-white' : 'bg-primary text-on-primary'
          )}
        >
          {initials}
        </span>
        <span className="hidden min-w-0 flex-1 flex-col items-start leading-tight md:flex">
          <span
            className={cn(
              'w-full truncate text-left text-[12.5px] font-medium',
              isDark ? 'text-white' : 'text-fg'
            )}
          >
            {displayName}
          </span>
          <span
            className={cn(
              'w-full truncate text-left text-[10.5px]',
              isDark ? 'text-white/70' : 'text-fg-subtle'
            )}
          >
            {role}
          </span>
        </span>
        <ChevronDownIcon
          width={13}
          height={13}
          className={cn(
            'shrink-0 transition-transform duration-200',
            isDark ? 'text-white/70' : 'text-fg-faint',
            open && 'rotate-180'
          )}
        />
      </button>

      <div
        role="menu"
        className={cn(
          'absolute left-0 right-0 top-[calc(100%+10px)] z-[100] origin-top-right',
          'overflow-hidden rounded-lg border border-border bg-bg p-1 shadow-xl ring-1 ring-black/[0.04]',
          'transition-[opacity,transform] duration-150',
          open
            ? 'opacity-100 scale-100 pointer-events-auto'
            : 'opacity-0 scale-95 pointer-events-none'
        )}
      >
        <button
          type="button"
          role="menuitem"
          onClick={handle(onProfile)}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[12.5px] font-medium text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg"
        >
          <UserCircleIcon width={16} height={16} className="text-fg-subtle" />
          Mi perfil
        </button>
        <button
          type="button"
          role="menuitem"
          onClick={handle(onLogout)}
          className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[12.5px] font-medium text-danger-text transition-colors hover:bg-danger-surface  dark:hover:bg-danger-surface"
        >
          <LogoutIcon width={16} height={16} />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}
