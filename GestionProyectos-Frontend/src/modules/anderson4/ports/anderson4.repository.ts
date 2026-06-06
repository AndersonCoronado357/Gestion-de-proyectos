import type { Anderson4 } from '../domain/anderson4.entity.js';
import type { CreateAnderson4Dto } from '../dtos/create-anderson4.dto.js';
import type { UpdateAnderson4Dto } from '../dtos/update-anderson4.dto.js';

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

export abstract class Anderson4Repository {
  abstract list(_pagination?: PaginationInput): Promise<PaginatedResult<Anderson4>>;
  abstract getById(_id: string): Promise<Anderson4>;
  abstract create(_data: CreateAnderson4Dto): Promise<Anderson4>;
  abstract update(_id: string, _data: UpdateAnderson4Dto): Promise<Anderson4>;
  abstract remove(_id: string): Promise<unknown>;
}
