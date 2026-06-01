import type { RoleItem } from '../domain/role.types';
import type { RolesRepositoryPort } from '../ports/roles.repository';

interface Deps {
  rolesRepository: RolesRepositoryPort;
}

module.exports =
  ({ rolesRepository }: Deps) =>
  async (): Promise<RoleItem[]> =>
    rolesRepository.list();
