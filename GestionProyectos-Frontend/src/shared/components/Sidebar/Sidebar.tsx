import { useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '../../lib/cn.js';
import {
  buildSidebarItems,
  findActiveContextIn,
  sidebarBottomItem,
  sidebarTopItem,
  type SidebarItem as SidebarItemType
} from './sidebar.config.js';
import SidebarItem from './SidebarItem.js';
import Skeleton from '../Skeleton/index.js';
import { useNavigationTree } from '../../../modules/navigation/NavigationContext.js';
import { matchesQuery, useSearchQuery } from '../../search/SearchContext.js';
import { useAuth } from '../../../modules/auth/ui/AuthContext.js';
import { filterAccessibleTree } from '../../../modules/auth/domain/permissions.js';

export interface SidebarProps {
  collapsed?: boolean;
  onToggle: () => void;
  activeId: string | null;
  onSelect: (id: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function Sidebar({
  collapsed: collapsedProp,
  onToggle,
  activeId,
  onSelect,
  mobileOpen = false,
  onCloseMobile
}: SidebarProps) {
  // En modo drawer (móvil abierto) el sidebar siempre se ve expandido.
  const collapsed = mobileOpen ? false : collapsedProp;

  const { tree, loading } = useNavigationTree();
  const { user } = useAuth();
  // Filtramos por permisos ANTES de armar los items del sidebar — así un
  // submódulo sin `view` para este usuario no aparece nunca en la lista
  // (ni en búsqueda, ni en sticky, ni nada).
  const accessibleTree = useMemo(
    () => filterAccessibleTree(tree, user),
    [tree, user]
  );
  const allItems = useMemo(
    () => buildSidebarItems(accessibleTree),
    [accessibleTree]
  );

  // Filtrado por el buscador global del header. Si la query matchea el
  // label del módulo, lo mostramos completo (con todos los submódulos).
  // Si matchea sólo algún submódulo, mostramos el módulo con esos subs
  // filtrados. Si no matchea nada, ocultamos el módulo.
  const query = useSearchQuery();
  const items = useMemo(() => {
    if (!query.trim()) return allItems;
    return allItems
      .map((mod) => {
        const modMatch = matchesQuery(mod.label, query);
        const filteredChildren = mod.children?.filter((c) =>
          matchesQuery(c.label, query)
        );
        if (modMatch) return mod; // mantener todos los hijos
        if (filteredChildren && filteredChildren.length > 0) {
          return { ...mod, children: filteredChildren };
        }
        return null;
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);
  }, [allItems, query]);

  const { module: parentModule } = findActiveContextIn(items, activeId);
  const navRef = useRef<HTMLElement | null>(null);

  const [openIds, setOpenIds] = useState<Set<string>>(() =>
    parentModule && parentModule.children
      ? new Set([parentModule.id])
      : new Set()
  );

  // Mantén abierto el módulo cuyo submódulo está activo si la tree cambia.
  useEffect(() => {
    if (parentModule?.children) {
      setOpenIds((prev) => {
        if (prev.has(parentModule.id)) return prev;
        const next = new Set(prev);
        next.add(parentModule.id);
        return next;
      });
    }
  }, [parentModule?.id, parentModule?.children]);

  // Cuando hay una query activa, expandimos automáticamente todos los
  // módulos que tienen al menos un submódulo en la lista filtrada — sino
  // el usuario vería los módulos contraídos y no podría ver el match.
  useEffect(() => {
    if (!query.trim()) return;
    const ids = items
      .filter((m) => m.children && m.children.length > 0)
      .map((m) => m.id);
    if (ids.length === 0) return;
    setOpenIds((prev) => {
      let changed = false;
      const next = new Set(prev);
      for (const id of ids) {
        if (!next.has(id)) {
          next.add(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [query, items]);

  const scrollToId = (id: string, delay = 120) => {
    setTimeout(() => {
      const el = navRef.current?.querySelector(`[data-id="${id}"]`);
      if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }, delay);
  };

  useEffect(() => {
    if (!activeId) return;
    scrollToId(activeId);
  }, [activeId]);

  const handleToggleSubmenu = (item: SidebarItemType) => {
    if (collapsed) {
      onToggle();
      setOpenIds((prev) => {
        const next = new Set(prev);
        next.add(item.id);
        return next;
      });
      scrollToId(item.id, 400);
      return;
    }
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  };

  const renderItem = (item: SidebarItemType) => (
    <SidebarItem
      key={item.id}
      item={item}
      open={openIds.has(item.id)}
      hasActiveChild={parentModule?.id === item.id && !!item.children}
      collapsed={collapsed}
      activeChildId={activeId}
      onToggleSubmenu={handleToggleSubmenu}
      onSelectChild={onSelect}
    />
  );

  return (
    <aside
      className={cn(
        'flex h-screen flex-col overflow-hidden bg-bg text-fg shadow-[1px_0_2px_rgba(15,23,42,0.04)]',
        'fixed inset-y-0 left-0 z-50 w-[240px] transition-transform duration-300 ease-out',
        'md:sticky md:top-0 md:z-40 md:w-auto md:translate-x-0 md:transition-none',
        mobileOpen ? 'translate-x-0' : '-translate-x-full'
      )}
    >
      {/* Logo + click → colapsa/expande (cierra drawer en mobile).
          Padding animado para que el logo derive al centro al colapsar
          en sincronía con el ancho del aside. */}
      <button
        type="button"
        onClick={mobileOpen ? onCloseMobile : onToggle}
        aria-label={
          mobileOpen
            ? 'Cerrar menú'
            : collapsed
              ? 'Expandir sidebar'
              : 'Colapsar sidebar'
        }
        className={cn(
          'flex h-14 shrink-0 items-center whitespace-nowrap bg-bg outline-none',
          'transition-[padding,gap,background-color] duration-300 ease-smooth hover:bg-bg-muted',
          collapsed ? 'gap-0 px-[14px]' : 'gap-2.5 px-4'
        )}
      >
        <span
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-on-primary shadow-sm"
          aria-hidden="true"
        >
          <span className="text-[13px] font-bold leading-none tracking-tight">GP</span>
        </span>
        <span
          className={cn(
            'min-w-0 truncate text-[14px] font-semibold tracking-tight text-fg',
            'transition-[max-width,opacity] duration-300 ease-smooth',
            collapsed ? 'max-w-0 opacity-0' : 'max-w-[200px] opacity-100'
          )}
        >
          Gestión de Proyectos
        </span>
      </button>

      <nav ref={navRef} className="flex-1 overflow-y-auto overflow-x-hidden py-2">
        {/* Inicio fijo arriba — opción del menú, no es un módulo de la
            tabla `modules` (no editable desde el builder). */}
        <ul>{renderItem(sidebarTopItem)}</ul>

        {loading && items.length === 0 ? (
          <SidebarItemsSkeleton collapsed={collapsed} />
        ) : (
          <ul>{items.map(renderItem)}</ul>
        )}
      </nav>

      <div className="shrink-0 py-2">
        <ul>{renderItem(sidebarBottomItem)}</ul>
      </div>
    </aside>
  );
}

// Filas placeholder mientras llega /api/navigation/tree.  Reproduce la
// altura/spacing del item real para que no haya "salto" cuando aparezca.
function SidebarItemsSkeleton({ collapsed }: { collapsed?: boolean }) {
  return (
    <ul className="px-2">
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i} className="flex h-10 items-center gap-3 px-2">
          <Skeleton variant="rect" width={17} height={17} />
          {!collapsed && (
            <Skeleton
              variant="text"
              height={11}
              width={`${55 + ((i * 11) % 35)}%`}
            />
          )}
        </li>
      ))}
    </ul>
  );
}
