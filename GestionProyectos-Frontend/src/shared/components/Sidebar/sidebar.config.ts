// Configuración del sidebar.
//
// Los módulos/submódulos vienen del backend vía /api/navigation/tree y se
// renderizan dinámicamente.  Sólo "Configuración" queda fijo aquí porque
// es la página de preferencias del usuario, no parte de la navegación
// administrable.

import type { ComponentType, SVGProps } from 'react';
import { SettingsIcon, HomeIcon } from '../icons/index.js';
import type {
  ModuleNode,
  SubmoduleNode
} from '../../../modules/navigation/domain/navigation.types.js';

export type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

/** Item rendereado en el sidebar — proveniente del backend o fijo. */
export interface SidebarChild {
  id: string;
  label: string;
  iconSvg: string | null;
  /** Fallback cuando no hay SVG personalizado en DB. */
  IconFallback?: IconComponent;
  path: string;
}

export interface SidebarItem {
  id: string;
  label: string;
  iconSvg: string | null;
  IconFallback?: IconComponent;
  path?: string;
  children?: SidebarChild[];
}

// Items fijos (no editables desde el builder). El de Inicio va arriba de
// los módulos dinámicos; el de Configuración queda al pie.
export const sidebarTopItem: SidebarItem & { path: string } = {
  id: 'home',
  label: 'Inicio',
  iconSvg: null,
  IconFallback: HomeIcon,
  path: '/inicio'
};

export const sidebarBottomItem: SidebarItem & { path: string } = {
  id: 'settings',
  label: 'Configuración',
  iconSvg: null,
  IconFallback: SettingsIcon,
  path: '/configuracion'
};

export const defaultPath = '/inicio';

// ── Mapping desde la tree del backend → items del sidebar ────────────

function moduleToItem(m: ModuleNode): SidebarItem {
  return {
    id: `mod-${m.id}`,
    label: m.name,
    iconSvg: m.icon,
    children:
      m.submodules.length > 0 ? m.submodules.map(submoduleToChild) : undefined
  };
}

function submoduleToChild(s: SubmoduleNode): SidebarChild {
  return {
    id: `sub-${s.id}`,
    label: s.name,
    iconSvg: s.icon,
    path: s.path ?? '#'
  };
}

export function buildSidebarItems(tree: ModuleNode[]): SidebarItem[] {
  return tree.map(moduleToItem);
}

// ── Helpers de búsqueda usados por Layout y Sidebar ──────────────────

export interface ActiveContext {
  module: SidebarItem | null;
  child: SidebarChild | null;
}

export function findActiveContextIn(
  items: SidebarItem[],
  activeId: string | null | undefined
): ActiveContext {
  if (!activeId) return { module: null, child: null };
  for (const item of items) {
    if (item.id === activeId) return { module: item, child: null };
    const child = item.children?.find((c) => c.id === activeId);
    if (child) return { module: item, child };
  }
  return { module: null, child: null };
}

export type SidebarRoutable = SidebarItem | SidebarChild;

export function findItemByPathIn(
  items: SidebarItem[],
  path: string
): SidebarRoutable | null {
  for (const item of items) {
    if (item.path === path) return item;
    const child = item.children?.find((c) => c.path === path);
    if (child) return child;
  }
  return null;
}
