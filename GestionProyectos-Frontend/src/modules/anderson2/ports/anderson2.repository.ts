import type { Anderson2 } from '../domain/anderson2.entity.js';
import type { CreateAnderson2Dto } from '../dtos/create-anderson2.dto.js';
import type { UpdateAnderson2Dto } from '../dtos/update-anderson2.dto.js';

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

export abstract class Anderson2Repository {
  abstract list(_pagination?: PaginationInput): Promise<PaginatedResult<Anderson2>>;
  abstract getById(_id: string): Promise<Anderson2>;
  abstract create(_data: CreateAnderson2Dto): Promise<Anderson2>;
  abstract update(_id: string, _data: UpdateAnderson2Dto): Promise<Anderson2>;
  abstract remove(_id: string): Promise<unknown>;
}
