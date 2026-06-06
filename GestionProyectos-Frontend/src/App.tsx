import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './shared/components/Layout/index.js';
import LoginPage from './modules/auth/ui/pages/LoginPage.js';
import SettingsPage from './modules/settings/ui/pages/SettingsPage.js';
import HomePage from './modules/home/ui/pages/HomePage.js';
import CreateSubmoduleHubPage from './modules/page-builder/ui/pages/CreateSubmoduleHubPage.js';
import SubmoduleListPage from './modules/page-builder/ui/pages/SubmoduleListPage.js';
import DesignEditorPage from './modules/design/ui/pages/DesignEditorPage.js';
import DesignPreviewPage from './modules/design/ui/pages/PreviewPage.js';
import { useMemo } from 'react';
import { ProtectedRoute } from './modules/auth/ui/ProtectedRoute.js';
import { InactivityGuard } from './modules/auth/ui/InactivityGuard.js';
import { useAuth } from './modules/auth/ui/AuthContext.js';
import { useNavigationTree } from './modules/navigation/NavigationContext.js';
import { resolvePage } from './config/page-registry.js';
import { defaultPath } from './shared/components/Sidebar/sidebar.config.js';
import { filterAccessibleTree } from './modules/auth/domain/permissions.js';

interface PagePlaceholderProps {
  label: string;
}

function PagePlaceholder({ label }: PagePlaceholderProps) {
  return (
    <div className="p-8">
      <h2 className="text-[18px] font-semibold text-fg">{label}</h2>
      <p className="text-[13px] text-fg-subtle">
        Contenido del módulo en construcción.
      </p>
    </div>
  );
}

function AppLayout() {
  return (
    <ProtectedRoute>
      <Layout>
        <InactivityGuard />
        <Outlet />
      </Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  const { tree } = useNavigationTree();
  const { user } = useAuth();

  // Aplanamos la tree a una lista de rutas: cada submódulo con `path`
  // se convierte en un <Route>.  El componente se resuelve por
  // `folderKey` contra el registro de páginas; si no hay match, va el
  // placeholder.
  //
  // El filtro por permisos se hace ACÁ (no sólo en el Sidebar) — si la
  // ruta no se registra, navegar manualmente a la URL del submódulo cae
  // en el catch-all `*` y redirige al default, sin renderizar la página.
  const accessibleTree = useMemo(
    () => filterAccessibleTree(tree, user),
    [tree, user]
  );

  const dynamicRoutes = accessibleTree.flatMap((mod) =>
    mod.submodules
      .filter((s): s is typeof s & { path: string } => !!s.path)
      .map((sub) => {
        const Page = resolvePage(sub.folderKey);
        return {
          key: `${mod.id}-${sub.id}`,
          path: sub.path,
          element: Page ? <Page /> : <PagePlaceholder label={sub.name} />
        };
      })
  );

  return (
    <Routes>
      {/* "/" entra al área autenticada → ProtectedRoute decide si va a
          /inicio o a /login. */}
      <Route path="/" element={<Navigate to={defaultPath} replace />} />
      <Route path="/login" element={<LoginPage />} />
      {/* Editor fullscreen del Diseñador: fuera del Layout normal para
          ocupar toda la pantalla. Sigue protegido por sesión. */}
      <Route
        path="/administracion/diseno/:id"
        element={
          <ProtectedRoute>
            <DesignEditorPage />
          </ProtectedRoute>
        }
      />
      <Route element={<AppLayout />}>
        {/* La vista previa del Diseñador SÍ va dentro del Layout normal
            (sidebar + header reales) para que se vea exacto como quedaría
            publicado. */}
        <Route
          path="/administracion/diseno/:id/preview"
          element={<DesignPreviewPage />}
        />
        {/* /inicio es fijo — vista landing, no proviene de la tabla `modules`. */}
        <Route path={defaultPath} element={<HomePage />} />
        {/* /configuracion es fijo — preferencias del usuario, fuera del builder. */}
        <Route path="/configuracion" element={<SettingsPage />} />
        {/* Lista intermedia: submódulos en edición. */}
        <Route
          path="/administracion/modulos/editor"
          element={<SubmoduleListPage />}
        />
        {/* Hub del submódulo seleccionado (árbol de carpetas + 5 opciones). */}
        <Route
          path="/administracion/modulos/editor/:id"
          element={<CreateSubmoduleHubPage />}
        />
        {/* Compatibilidad con la URL vieja del Hub sin id → redirige a la lista. */}
        <Route
          path="/administracion/modulos/crear-submodulo"
          element={<Navigate to="/administracion/modulos/editor" replace />}
        />
        {dynamicRoutes.map((r) => (
          <Route key={r.key} path={r.path} element={r.element} />
        ))}
      </Route>
      {/* URL desconocida: mandamos a inicio.  Si el usuario no está
          autenticado, ProtectedRoute la convierte en /login. */}
      <Route path="*" element={<Navigate to={defaultPath} replace />} />
    </Routes>
  );
}
