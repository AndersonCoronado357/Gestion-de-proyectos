import type { Anderson } from '../domain/anderson.entity.js';
import type { CreateAndersonDto } from '../dtos/create-anderson.dto.js';
import type { UpdateAndersonDto } from '../dtos/update-anderson.dto.js';

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

export abstract class AndersonRepository {
  abstract list(_pagination?: PaginationInput): Promise<PaginatedResult<Anderson>>;
  abstract getById(_id: string): Promise<Anderson>;
  abstract create(_data: CreateAndersonDto): Promise<Anderson>;
  abstract update(_id: string, _data: UpdateAndersonDto): Promise<Anderson>;
  abstract remove(_id: string): Promise<unknown>;
}
