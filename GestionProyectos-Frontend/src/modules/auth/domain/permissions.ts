// Helpers de chequeo de permisos del usuario autenticado.
//
// Convenciones del backend (módulo roles):
//   - permissions[] viene como strings "<resource>:<action>".
//   - Para submódulos, resource = "submodule:<id>" y action ∈
//     view | create | edit | delete.
//
// Bypass: si user.isSuper === true, todas las funciones devuelven true.
// Eso evita tener que cargar permisos explícitos del rol superadmin y
// hace que módulos creados después del seed se vean automáticamente.

import type { AuthUser } from './user.js';
import type { ModuleNode } from '../../navigation/domain/navigation.types.js';

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export const PERMISSION_ACTIONS: readonly PermissionAction[] = [
  'view',
  'create',
  'edit',
  'delete'
] as const;

function submoduleKey(submoduleId: number | string, action: PermissionAction): string {
  return `submodule:${submoduleId}:${action}`;
}

/** True si el usuario puede ejecutar `action` sobre el submódulo. */
export function canActOnSubmodule(
  user: AuthUser | null,
  submoduleId: number | string,
  action: PermissionAction
): boolean {
  if (!user) return false;
  if (user.isSuper) return true;
  return user.permissions.includes(submoduleKey(submoduleId, action));
}

/**
 * True si el usuario tiene ALGÚN permiso sobre el submódulo.
 *
 * Esto es lo que gobierna la visibilidad en sidebar/rutas: si tildaste
 * `create` (o `edit`, o `delete`) pero no `view`, el submódulo igual
 * tiene que aparecer — sino el usuario no puede llegar a la pantalla
 * que necesita.  El gate fino por acción (botones de crear/editar/
 * eliminar) usa `canActOnSubmodule` por separado.
 */
export function canAccessSubmodule(
  user: AuthUser | null,
  submoduleId: number | string
): boolean {
  if (!user) return false;
  if (user.isSuper) return true;
  return PERMISSION_ACTIONS.some((a) =>
    user.permissions.includes(submoduleKey(submoduleId, a))
  );
}

/**
 * Devuelve la tree de navegación recortada a lo que el usuario puede ver.
 *
 *   - superadmin: la tree intacta (incluso módulos creados después del seed).
 *   - usuario normal: sólo submódulos con permiso `view`; módulos cuyos
 *     submódulos quedan todos filtrados también se ocultan.
 *   - sin user: árbol vacío (sirve como red de seguridad antes de
 *     hidratarse desde /auth/me).
 */
export function filterAccessibleTree(
  tree: ModuleNode[],
  user: AuthUser | null
): ModuleNode[] {
  if (!user) return [];
  if (user.isSuper) return tree;
  return tree
    .map((m) => ({
      ...m,
      submodules: m.submodules.filter((s) => canAccessSubmodule(user, s.id))
    }))
    .filter((m) => m.submodules.length > 0);
}
