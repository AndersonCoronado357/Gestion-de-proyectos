import type { CSSProperties } from 'react';
import { cn } from '../../lib/cn.js';
import { ChevronRightIcon, BoxIcon } from '../icons/index.jsx';
import type { SidebarChild, SidebarItem as SidebarItemType } from './sidebar.config.js';

export interface SidebarItemProps {
  item: SidebarItemType;
  open: boolean;
  hasActiveChild: boolean;
  collapsed?: boolean;
  activeChildId: string | null;
  onToggleSubmenu: (item: SidebarItemType) => void;
  onSelectChild: (id: string) => void;
}

function ItemIcon({
  iconSvg,
  Fallback,
  size,
  className
}: {
  iconSvg: string | null;
  Fallback?: SidebarItemType['IconFallback'];
  size: number;
  className?: string;
}) {
  const style: CSSProperties = { width: size, height: size, lineHeight: 0 };
  if (iconSvg) {
    return (
      <span
        aria-hidden="true"
        className={cn(
          'relative inline-flex shrink-0 [&>svg]:h-full [&>svg]:w-full',
          className
        )}
        style={style}
        dangerouslySetInnerHTML={{ __html: iconSvg }}
      />
    );
  }
  if (Fallback) {
    return (
      <Fallback width={size} height={size} className={cn('relative shrink-0', className)} />
    );
  }
  return (
    <BoxIcon width={size} height={size} className={cn('relative shrink-0 opacity-50', className)} />
  );
}

export default function SidebarItem({
  item,
  open,
  hasActiveChild,
  collapsed,
  activeChildId,
  onToggleSubmenu,
  onSelectChild
}: SidebarItemProps) {
  const { label, children } = item;
  const hasChildren = !!children;

  const isLeafActive = !hasChildren && activeChildId === item.id;
  const isParentOfActive = hasChildren && hasActiveChild;
  const isHighlighted = isLeafActive || (collapsed && isParentOfActive);
  const isParentHinted = !collapsed && isParentOfActive;

  // El submenú se pliega cuando el sidebar está colapsado. Esto sincroniza
  // su animación con la del ancho del aside (ambas 300ms ease-smooth).
  const submenuOpen = !!(hasChildren && open && !collapsed);

  const handleClick = () => {
    if (hasChildren) onToggleSubmenu(item);
    else onSelectChild(item.id);
  };

  // Layout fijo + animación SIMÉTRICA al abrir y cerrar:
  //   - El padding anima 16px ↔ 21.5px, así el icono va derivando hacia
  //     el centro del ancho colapsado (60px) en vez de "saltar".
  //   - El label y el chevron tienen `max-width` animado de 0 a su
  //     tamaño natural, combinado con un fade de `opacity`.  Resultado:
  //     se cierran "con" el sidebar, no se borran antes.
  //   - El submenú usa `grid-rows` (1fr ↔ 0fr) que se anima en paralelo.
  // Todas las propiedades comparten duration 300ms + ease-smooth.
  return (
    <li className="relative">
      <button
        type="button"
        data-id={item.id}
        onClick={handleClick}
        title={collapsed ? label : undefined}
        className={cn(
          'group relative flex h-10 w-full items-center whitespace-nowrap text-[13.5px] tracking-tight outline-none',
          'transition-[padding,gap,background-color,color] duration-300 ease-smooth',
          collapsed ? 'gap-0 px-[21.5px]' : 'gap-3 px-4',
          isHighlighted
            ? 'font-semibold text-on-primary'
            : isParentHinted
              ? 'font-semibold text-primary hover:bg-primary-50'
              : 'font-medium text-fg-muted hover:bg-primary-50 hover:text-primary'
        )}
      >
        {isHighlighted && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-1 inset-x-2 rounded-md bg-primary"
          />
        )}
        <ItemIcon
          iconSvg={item.iconSvg}
          Fallback={item.IconFallback}
          size={17}
          className={cn(
            'transition-colors duration-300 ease-smooth',
            isHighlighted
              ? 'text-on-primary'
              : isParentHinted
                ? 'text-primary'
                : 'text-fg-subtle group-hover:text-primary'
          )}
        />
        <span
          className={cn(
            'relative min-w-0 flex-1 truncate text-left transition-[max-width,opacity] duration-300 ease-smooth',
            collapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'
          )}
        >
          {label}
        </span>
        {hasChildren && (
          <span
            aria-hidden="true"
            className={cn(
              'relative inline-flex shrink-0 items-center overflow-hidden transition-[max-width,opacity] duration-300 ease-smooth',
              collapsed ? 'max-w-0 opacity-0' : 'max-w-[13px] opacity-100',
              isParentHinted
                ? 'text-primary'
                : 'text-fg-faint group-hover:text-primary'
            )}
          >
            <ChevronRightIcon
              width={13}
              height={13}
              className={cn(
                'transition-transform duration-200 ease-smooth',
                submenuOpen && 'rotate-90'
              )}
            />
          </span>
        )}
      </button>

      {hasChildren && (
        <div
          className={cn(
            'grid transition-[grid-template-rows] duration-300 ease-smooth',
            submenuOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          )}
        >
          <ul
            className={cn(
              'overflow-hidden',
              !submenuOpen && 'pointer-events-none'
            )}
          >
            {children!.map((sub: SidebarChild) => {
              const subActive = activeChildId === sub.id;
              return (
                <li key={sub.id} className="relative">
                  <button
                    type="button"
                    data-id={sub.id}
                    onClick={() => onSelectChild(sub.id)}
                    className={cn(
                      'group relative flex h-9 w-full items-center gap-2.5 whitespace-nowrap pl-9 pr-3 text-[12.5px] outline-none',
                      'transition-colors duration-150',
                      subActive
                        ? 'font-semibold text-on-primary'
                        : 'font-medium text-fg-muted hover:bg-primary-50 hover:text-primary'
                    )}
                  >
                    {subActive && (
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-y-1 inset-x-2 rounded-md bg-primary"
                      />
                    )}
                    <ItemIcon
                      iconSvg={sub.iconSvg}
                      Fallback={sub.IconFallback}
                      size={14}
                      className={
                        subActive
                          ? 'text-on-primary'
                          : 'text-fg-faint group-hover:text-primary'
                      }
                    />
                    <span className="relative truncate text-left">{sub.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </li>
  );
}
