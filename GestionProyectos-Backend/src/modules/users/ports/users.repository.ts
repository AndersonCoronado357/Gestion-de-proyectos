// Port del UsersRepository.

import type { UserListItem } from '../domain/user-list-item';

export interface UsersRepositoryPort {
  list(): Promise<UserListItem[]>;
  /**
   * Reemplaza atómicamente el set de roles de un usuario.
   * Devuelve la lista resultante de nombres de rol persistidos
   * (sólo los que existen en `roles`).
   */
  replaceUserRoles(userId: number, roleNames: string[]): Promise<string[]>;
}

class UsersRepository implements UsersRepositoryPort {
  async list(): Promise<UserListItem[]> {
    throw new Error('Not implemented');
  }
  async replaceUserRoles(_userId: number, _roleNames: string[]): Promise<string[]> {
    throw new Error('Not implemented');
  }
}

module.exports = UsersRepository;
module.exports.default = UsersRepository;
