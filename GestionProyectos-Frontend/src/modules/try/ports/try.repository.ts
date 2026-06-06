import type { Try } from '../domain/try.entity.js';
import type { CreateTryDto } from '../dtos/create-try.dto.js';
import type { UpdateTryDto } from '../dtos/update-try.dto.js';

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

export abstract class TryRepository {
  abstract list(_pagination?: PaginationInput): Promise<PaginatedResult<Try>>;
  abstract getById(_id: string): Promise<Try>;
  abstract create(_data: CreateTryDto): Promise<Try>;
  abstract update(_id: string, _data: UpdateTryDto): Promise<Try>;
  abstract remove(_id: string): Promise<unknown>;
}
