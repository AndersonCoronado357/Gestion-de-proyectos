import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/index.js';
import Header from '../Header/index.js';
import {
  buildSidebarItems,
  findActiveContextIn,
  findItemByPathIn,
  sidebarBottomItem,
  sidebarTopItem,
  defaultPath
} from '../Sidebar/sidebar.config.js';
import { useAuth } from '../../../modules/auth/ui/AuthContext.js';
import { useNavigationTree } from '../../../modules/navigation/NavigationContext.js';

export interface LayoutProps {
  children: ReactNode;
}

function initialsFor(firstName: string | undefined, lastName: string | undefined): string {
  const f = firstName?.trim()?.[0] ?? '';
  const l = lastName?.trim()?.[0] ?? '';
  return (f + l).toUpperCase() || '?';
}

// Preferencia de UI puramente cliente — no es parte del modelo del
// usuario en la DB.  Vive en localStorage para sobrevivir al reload.
const SIDEBAR_COLLAPSED_KEY = 'gestionproyectos:sidebar-collapsed';

function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === 'true';
  } catch {
    return false;
  }
}

function persistSidebarCollapsed(value: boolean): void {
  try {
    localStorage.setItem(SIDEBAR_COLLAPSED_KEY, value ? 'true' : 'false');
  } catch {
    // ignore (quota / modo privado)
  }
}

export default function Layout({ children }: LayoutProps) {
  // Lectura sincrónica desde localStorage para que el primer paint ya
  // tenga el ancho correcto del sidebar — sin "salto" al hidratar.
  const [collapsed, setCollapsedState] = useState<boolean>(readSidebarCollapsed);
  const setCollapsed = (next: boolean | ((prev: boolean) => boolean)) => {
    setCollapsedState((prev) => {
      const value = typeof next === 'function' ? next(prev) : next;
      persistSidebarCollapsed(value);
      return value;
    });
  };
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { tree } = useNavigationTree();

  // Lista completa para resolver título y highlight: Inicio fijo arriba,
  // módulos dinámicos del backend, Configuración fija al pie.
  const allItems = useMemo(
    () => [sidebarTopItem, ...buildSidebarItems(tree), sidebarBottomItem],
    [tree]
  );

  const itemFromPath = findItemByPathIn(allItems, location.pathname);
  const activeId = itemFromPath?.id ?? null;
  const { module, child } = findActiveContextIn(allItems, activeId);
  // Títulos para rutas fijas que no están en la tree de navegación.
  const FIXED_TITLES: Record<string, string> = {
    '/administracion/modulos/crear-submodulo': 'Crear submódulo'
  };
  const title =
    FIXED_TITLES[location.pathname] ?? child?.label ?? module?.label;

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleSelect = (id: string) => {
    const ctx = findActiveContextIn(allItems, id);
    const target = ctx.child ?? ctx.module;
    if (target?.path) navigate(target.path);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  const displayName = user
    ? `${user.firstName} ${user.lastName}`.trim() || user.username
    : '';
  const roleLabel = user?.roles?.[0] ?? '';

  return (
    <div
      className="h-[100dvh] bg-page md:grid"
      style={{
        gridTemplateColumns: collapsed ? '60px 1fr' : '224px 1fr',
        transition: 'grid-template-columns 350ms cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {mobileOpen && (
        <button
          type="button"
          aria-label="Cerrar menú"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden animate-[fade-in_180ms_ease-out]"
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        activeId={activeId}
        onSelect={handleSelect}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex h-full min-w-0 flex-col overflow-hidden">
        <Header
          title={title}
          displayName={displayName}
          role={roleLabel}
          initials={initialsFor(user?.firstName, user?.lastName)}
          onProfile={() => navigate('/configuracion')}
          onLogout={handleLogout}
          onMenu={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

export { defaultPath };
