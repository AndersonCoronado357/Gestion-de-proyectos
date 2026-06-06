// Registro folder_key → componente de página.
//
// El árbol del backend contiene `folderKey` por submódulo (ej. 'users',
// 'components').  Acá traducimos esa clave al componente real de React.
//
// Dos fuentes:
//   1. STATIC: mapping explícito para los módulos administrativos
//      hand-coded (Módulos, Roles, Usuarios, etc.).
//   2. AUTO: descubrimos via Vite `import.meta.glob` cualquier
//      `<Key>ListPage.tsx` bajo `src/modules/<key>/ui/pages/` — eso
//      cubre los submódulos generados por el page-builder en disco
//      sin tener que tocar este archivo a mano cada vez.
//
// El static gana sobre el auto (mismo folder_key).
//
// Si tras ambas fuentes no hay match, renderizamos un PagePlaceholder
// con el label — "ruta registrada, vista todavía no construida".

import type { ComponentType } from 'react';
import ModulesBuilderPage from '../modules/modules-and-submodules/ui/pages/ModulesBuilderPage.js';
import RolesAndPermissionsPage from '../modules/roles-and-permissions/ui/pages/RolesAndPermissionsPage.js';
import UsersPage from '../modules/users/ui/pages/UsersPage.js';
import ComponentsPage from '../modules/components/ui/pages/ComponentsPage.js';
import LoginContentPage from '../modules/login-content/ui/pages/LoginContentPage.js';
import TestRunnerPage from '../modules/test-runner/ui/pages/TestRunnerPage.js';
import LogsPage from '../modules/logs/ui/pages/LogsPage.js';
import IconsPage from '../modules/icons/ui/pages/IconsPage.js';
import SubmoduleListPage from '../modules/page-builder/ui/pages/SubmoduleListPage.js';

const STATIC_REGISTRY: Record<string, ComponentType> = {
  'modules-and-submodules': ModulesBuilderPage,
  'page-builder': SubmoduleListPage,
  'roles-and-permissions': RolesAndPermissionsPage,
  users: UsersPage,
  components: ComponentsPage,
  'login-content': LoginContentPage,
  'test-runner': TestRunnerPage,
  logs: LogsPage,
  icons: IconsPage
};

// Auto-discovery: a build time, Vite indexa cualquier archivo cuya ruta
// matchee. El nombre del archivo viene como `<Pascal>ListPage` — no nos
// importa el Pascal, lo que importa es la carpeta del módulo (el primer
// segmento después de `modules/`), que es el folder_key.
// Eager: el bundle ya incluye estos componentes — más simple y sin
// necesidad de Suspense en los Routes dinámicos.
const moduleEntryModules = import.meta.glob<{ default: ComponentType }>(
  '../modules/*/ui/pages/*ListPage.tsx',
  { eager: true }
);

const AUTO_REGISTRY: Record<string, ComponentType> = {};
for (const fullPath in moduleEntryModules) {
  const match = /\.\.\/modules\/([^/]+)\/ui\/pages\/[^/]+ListPage\.tsx$/.exec(fullPath);
  if (!match) continue;
  const folderKey = match[1];
  if (STATIC_REGISTRY[folderKey]) continue; // static gana
  const mod = moduleEntryModules[fullPath];
  if (mod?.default) AUTO_REGISTRY[folderKey] = mod.default;
}

export const PAGE_REGISTRY: Record<string, ComponentType> = {
  ...AUTO_REGISTRY,
  ...STATIC_REGISTRY
};

export function resolvePage(folderKey: string | null): ComponentType | null {
  if (!folderKey) return null;
  return PAGE_REGISTRY[folderKey] ?? null;
}
