import type { PermissionMap } from '../domain/role.entity.js';

export interface CreateRoleInput {
  name?: string;
  description?: string;
  permissions?: PermissionMap;
}

export interface CreateRoleDto {
  name: string | undefined;
  description: string;
  permissions: PermissionMap;
}

export const toCreateDto = ({
  name,
  description,
  permissions
}: CreateRoleInput = {}): CreateRoleDto => ({
  name,
  description: description ?? '',
  permissions: permissions ?? {}
});
