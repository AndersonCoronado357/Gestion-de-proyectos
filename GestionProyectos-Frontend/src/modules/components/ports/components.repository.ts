import type { Components } from '../domain/components.entity.js';
import type { CreateComponentsDto } from '../dtos/create-components.dto.js';
import type { UpdateComponentsDto } from '../dtos/update-components.dto.js';

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

export abstract class ComponentsRepository {
  abstract list(_pagination?: PaginationInput): Promise<PaginatedResult<Components>>;
  abstract getById(_id: string): Promise<Components>;
  abstract create(_data: CreateComponentsDto): Promise<Components>;
  abstract update(_id: string, _data: UpdateComponentsDto): Promise<Components>;
  abstract remove(_id: string): Promise<unknown>;
}
