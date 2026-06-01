// Port del RolesRepository.

import type {
  RoleCreateInput,
  RoleItem,
  RoleUpdateInput
} from '../domain/role.types';

export interface RolesRepositoryPort {
  list(): Promise<RoleItem[]>;
  findById(id: number): Promise<RoleItem | null>;
  create(input: RoleCreateInput): Promise<RoleItem>;
  update(id: number, input: RoleUpdateInput): Promise<RoleItem>;
  softDelete(id: number): Promise<void>;
}

class RolesRepository implements RolesRepositoryPort {
  async list(): Promise<RoleItem[]> {
    throw new Error('Not implemented');
  }
  async findById(_id: number): Promise<RoleItem | null> {
    throw new Error('Not implemented');
  }
  async create(_input: RoleCreateInput): Promise<RoleItem> {
    throw new Error('Not implemented');
  }
  async update(_id: number, _input: RoleUpdateInput): Promise<RoleItem> {
    throw new Error('Not implemented');
  }
  async softDelete(_id: number): Promise<void> {
    throw new Error('Not implemented');
  }
}

module.exports = RolesRepository;
module.exports.default = RolesRepository;
