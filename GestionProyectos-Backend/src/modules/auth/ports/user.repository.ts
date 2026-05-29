// Port: contrato del UserRepository.
// Las implementaciones concretas (Knex/SQL Server, en memoria para tests,
// etc.) deben respetar esta firma.

import type { UserRow } from '../domain/auth.types';

export interface UserWithAccess extends UserRow {
  roles: string[];
  permissions: string[];
  /** True si al menos uno de los roles tiene is_super=1. */
  isSuper: boolean;
}

export interface UserRepositoryPort {
  findByUsername(username: string): Promise<UserRow | undefined>;
  findByEmail(email: string): Promise<UserRow | undefined>;
  findById(id: number): Promise<UserRow | undefined>;
  findWithAccessById(id: number): Promise<UserWithAccess | undefined>;
  updateLastLogin(id: number, when: Date): Promise<void>;
  /** Heartbeat de actividad — actualiza last_activity_at sin tocar el resto. */
  updateLastActivity(id: number, when: Date): Promise<void>;
}

class UserRepository implements UserRepositoryPort {
  async findByUsername(_username: string): Promise<UserRow | undefined> {
    throw new Error('Not implemented');
  }
  async findByEmail(_email: string): Promise<UserRow | undefined> {
    throw new Error('Not implemented');
  }
  async findById(_id: number): Promise<UserRow | undefined> {
    throw new Error('Not implemented');
  }
  async findWithAccessById(_id: number): Promise<UserWithAccess | undefined> {
    throw new Error('Not implemented');
  }
  async updateLastLogin(_id: number, _when: Date): Promise<void> {
    throw new Error('Not implemented');
  }
  async updateLastActivity(_id: number, _when: Date): Promise<void> {
    throw new Error('Not implemented');
  }
}

module.exports = UserRepository;
module.exports.default = UserRepository;
