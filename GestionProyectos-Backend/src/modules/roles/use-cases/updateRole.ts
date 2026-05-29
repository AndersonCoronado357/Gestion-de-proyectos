import type { RoleItem, RoleUpdateInput } from '../domain/role.types';
import type { RolesRepositoryPort } from '../ports/roles.repository';
import { realtime } from '../../../shared/realtime/adapters/sse.adapter';

interface Deps {
  rolesRepository: RolesRepositoryPort;
}

interface Input {
  id: number;
  patch: RoleUpdateInput;
}

module.exports =
  ({ rolesRepository }: Deps) =>
  async ({ id, patch }: Input): Promise<RoleItem> => {
    const role = await rolesRepository.update(id, patch);
    realtime.broadcast('roles', { type: 'updated', role });
    return role;
  };
