// Adapter HTTP del módulo Users.
//
// Usa el cliente compartido `http` que inyecta el access token y maneja
// auto-refresh en 401.

import { http } from '../../../../shared/utils/http.js';
import type { RemoteUserListItem } from '../../domain/user.mapper.js';

interface ListResponse {
  users: RemoteUserListItem[];
}

interface RolesResponse {
  roles: string[];
}

export const usersHttpAdapter = {
  async list(): Promise<RemoteUserListItem[]> {
    const data = await http<ListResponse>('/users', { method: 'GET' });
    return data?.users ?? [];
  },

  async replaceRoles(userId: number, roles: string[]): Promise<string[]> {
    const data = await http<RolesResponse>(`/users/${userId}/roles`, {
      method: 'PUT',
      body: { roles }
    });
    return data?.roles ?? [];
  }
};
