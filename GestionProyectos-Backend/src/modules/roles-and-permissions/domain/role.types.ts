// Tipos del módulo de roles.
//
// Modelo del front:
//   - `permissions` es un mapa `submoduleId → { view, create, edit, delete }`.
//   - `cargos` es un array de `service.code` (catálogo de cargos).
//
// El backend almacena:
//   - permisos via tabla `permissions` (con `resource = 'submodule:<id>'`)
//     y pivot `role_permissions`.
//   - cargos via pivot `role_services`.

export type PermissionAction = 'view' | 'create' | 'edit' | 'delete';

export type RolePermissionMap = Record<string, Partial<Record<PermissionAction, boolean>>>;

export interface RoleItem {
  id: number;
  name: string;
  description: string | null;
  permissions: RolePermissionMap;
  cargos: string[]; // service codes
  /** Bypass: true → el rol tiene acceso total automáticamente. */
  isSuper: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleCreateInput {
  name: string;
  description?: string | null;
  permissions?: RolePermissionMap;
  cargos?: string[];
}

export interface RoleUpdateInput {
  name?: string;
  description?: string | null;
  permissions?: RolePermissionMap;
  cargos?: string[];
}

export const PERMISSION_ACTIONS: readonly PermissionAction[] = [
  'view',
  'create',
  'edit',
  'delete'
] as const;
