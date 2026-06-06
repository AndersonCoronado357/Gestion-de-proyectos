import type { Anderson3 } from '../domain/anderson3.entity.js';
import type { CreateAnderson3Dto } from '../dtos/create-anderson3.dto.js';
import type { UpdateAnderson3Dto } from '../dtos/update-anderson3.dto.js';

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

export abstract class Anderson3Repository {
  abstract list(_pagination?: PaginationInput): Promise<PaginatedResult<Anderson3>>;
  abstract getById(_id: string): Promise<Anderson3>;
  abstract create(_data: CreateAnderson3Dto): Promise<Anderson3>;
  abstract update(_id: string, _data: UpdateAnderson3Dto): Promise<Anderson3>;
  abstract remove(_id: string): Promise<unknown>;
}
