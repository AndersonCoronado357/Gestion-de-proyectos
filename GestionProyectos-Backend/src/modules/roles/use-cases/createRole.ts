import type { RoleCreateInput, RoleItem } from '../domain/role.types';
import type { RolesRepositoryPort } from '../ports/roles.repository';
import { realtime } from '../../../shared/realtime/adapters/sse.adapter';

interface Deps {
  rolesRepository: RolesRepositoryPort;
}

module.exports =
  ({ rolesRepository }: Deps) =>
  async (input: RoleCreateInput): Promise<RoleItem> => {
    const role = await rolesRepository.create(input);
    realtime.broadcast('roles', { type: 'created', role });
    return role;
  };
