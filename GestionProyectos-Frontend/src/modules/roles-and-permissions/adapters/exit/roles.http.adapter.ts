// HTTP adapter del módulo Roles & Permisos.
//
// Usa el cliente compartido `http` (auth + auto-refresh + cookies).

import { http } from '../../../../shared/utils/http.js';
import type { PermissionMap } from '../../domain/role.entity.js';

export interface RemoteRole {
  id: number;
  name: string;
  description: string | null;
  permissions: PermissionMap;
  cargos: string[];
  /** True para roles de sistema (superadmin) — tienen acceso total. */
  isSuper: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RoleCreateBody {
  name: string;
  description?: string | null;
  permissions?: PermissionMap;
  cargos?: string[];
}

export type RoleUpdateBody = Partial<RoleCreateBody>;

interface ListResponse {
  roles: RemoteRole[];
}

interface SingleResponse {
  role: RemoteRole;
}

export const rolesHttpAdapter = {
  async list(): Promise<RemoteRole[]> {
    const data = await http<ListResponse>('/roles', { method: 'GET' });
    return data?.roles ?? [];
  },

  async create(body: RoleCreateBody): Promise<RemoteRole | null> {
    const data = await http<SingleResponse>('/roles', {
      method: 'POST',
      body
    });
    return data?.role ?? null;
  },

  async update(id: number, body: RoleUpdateBody): Promise<RemoteRole | null> {
    const data = await http<SingleResponse>(`/roles/${id}`, {
      method: 'PUT',
      body
    });
    return data?.role ?? null;
  },

  async remove(id: number): Promise<void> {
    await http(`/roles/${id}`, { method: 'DELETE' });
  }
};
