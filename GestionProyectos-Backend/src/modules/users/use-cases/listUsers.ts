// Use case: lista todos los usuarios vivos del sistema.

import type { UserListItem } from '../domain/user-list-item';
import type { UsersRepositoryPort } from '../ports/users.repository';

interface Deps {
  usersRepository: UsersRepositoryPort;
}

module.exports =
  ({ usersRepository }: Deps) =>
  async (): Promise<UserListItem[]> =>
    usersRepository.list();
