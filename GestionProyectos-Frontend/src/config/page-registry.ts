// Registro folder_key → componente de página.
//
// El árbol del backend contiene `folderKey` por submódulo (ej. 'users',
// 'components').  Acá traducimos esa clave al componente real de React.
//
// Cuando el admin agrega un submódulo en el builder cuyo folderKey no
// existe en este mapa, renderizamos un PagePlaceholder con el label —
// suficiente para indicar "ruta registrada, vista todavía no construida".

import type { ComponentType } from 'react';
import ModulesBuilderPage from '../modules/modules-and-submodules/ui/pages/ModulesBuilderPage.js';
import RolesAndPermissionsPage from '../modules/roles-and-permissions/ui/pages/RolesAndPermissionsPage.js';
import UsersPage from '../modules/users/ui/pages/UsersPage.js';
import ComponentsPage from '../modules/components/ui/pages/ComponentsPage.js';
import LoginContentPage from '../modules/login-content/ui/pages/LoginContentPage.js';

export const PAGE_REGISTRY: Record<string, ComponentType> = {
  'modules-and-submodules': ModulesBuilderPage,
  'roles-and-permissions': RolesAndPermissionsPage,
  users: UsersPage,
  components: ComponentsPage,
  'login-content': LoginContentPage
};

export function resolvePage(folderKey: string | null): ComponentType | null {
  if (!folderKey) return null;
  return PAGE_REGISTRY[folderKey] ?? null;
}
