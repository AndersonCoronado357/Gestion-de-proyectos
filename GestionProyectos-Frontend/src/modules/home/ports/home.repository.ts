import type { Home } from '../domain/home.entity.js';
import type { CreateHomeDto } from '../dtos/create-home.dto.js';
import type { UpdateHomeDto } from '../dtos/update-home.dto.js';

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

export abstract class HomeRepository {
  abstract list(_pagination?: PaginationInput): Promise<PaginatedResult<Home>>;
  abstract getById(_id: string): Promise<Home>;
  abstract create(_data: CreateHomeDto): Promise<Home>;
  abstract update(_id: string, _data: UpdateHomeDto): Promise<Home>;
  abstract remove(_id: string): Promise<unknown>;
}
