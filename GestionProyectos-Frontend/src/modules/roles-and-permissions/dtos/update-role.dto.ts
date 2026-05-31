import type { PermissionMap } from '../domain/role.entity.js';

export interface UpdateRoleInput {
  id?: string;
  name?: string;
  description?: string;
  permissions?: PermissionMap;
}

export interface UpdateRoleDto {
  id: string | undefined;
  name: string | undefined;
  description: string;
  permissions: PermissionMap;
}

export const toUpdateDto = ({
  id,
  name,
  description,
  permissions
}: UpdateRoleInput = {}): UpdateRoleDto => ({
  id,
  name,
  description: description ?? '',
  permissions: permissions ?? {}
});
