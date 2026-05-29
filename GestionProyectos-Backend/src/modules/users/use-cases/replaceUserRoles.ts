// Use case: reemplaza el set de roles de un usuario y broadcastea el
// cambio por SSE.  Pensado para PUT /api/users/:id/roles.

import type { UsersRepositoryPort } from '../ports/users.repository';
import { realtime } from '../../../shared/realtime/adapters/sse.adapter';

interface Deps {
  usersRepository: UsersRepositoryPort;
}

interface Input {
  userId: number;
  roleNames: string[];
}

module.exports =
  ({ usersRepository }: Deps) =>
  async ({ userId, roleNames }: Input): Promise<{ roles: string[] }> => {
    const roles = await usersRepository.replaceUserRoles(userId, roleNames);
    realtime.broadcast('users', {
      type: 'roles',
      userId,
      roles
    });
    return { roles };
  };
