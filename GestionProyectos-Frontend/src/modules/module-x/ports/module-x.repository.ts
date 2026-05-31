import type { ModuleX } from '../domain/module-x.entity.js';
import type { CreateModuleXDto } from '../dtos/create-module-x.dto.js';
import type { UpdateModuleXDto } from '../dtos/update-module-x.dto.js';

export interface PaginationInput {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export abstract class ModuleXRepository {
  abstract list(_pagination?: PaginationInput): Promise<PaginatedResult<ModuleX>>;
  abstract getById(_id: string): Promise<ModuleX>;
  abstract create(_data: CreateModuleXDto): Promise<ModuleX>;
  abstract update(_id: string, _data: UpdateModuleXDto): Promise<ModuleX>;
  abstract remove(_id: string): Promise<unknown>;
}
