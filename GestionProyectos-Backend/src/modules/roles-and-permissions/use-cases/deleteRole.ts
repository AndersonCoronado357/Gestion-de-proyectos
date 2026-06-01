import type { RolesRepositoryPort } from '../ports/roles.repository';
import { realtime } from '../../../shared/realtime/adapters/sse.adapter';

interface Deps {
  rolesRepository: RolesRepositoryPort;
}

module.exports =
  ({ rolesRepository }: Deps) =>
  async ({ id }: { id: number }): Promise<void> => {
    await rolesRepository.softDelete(id);
    realtime.broadcast('roles', { type: 'deleted', roleId: id });
  };
