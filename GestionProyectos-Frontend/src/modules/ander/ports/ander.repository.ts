import type { Ander } from '../domain/ander.entity.js';
import type { CreateAnderDto } from '../dtos/create-ander.dto.js';
import type { UpdateAnderDto } from '../dtos/update-ander.dto.js';

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

export abstract class AnderRepository {
  abstract list(_pagination?: PaginationInput): Promise<PaginatedResult<Ander>>;
  abstract getById(_id: string): Promise<Ander>;
  abstract create(_data: CreateAnderDto): Promise<Ander>;
  abstract update(_id: string, _data: UpdateAnderDto): Promise<Ander>;
  abstract remove(_id: string): Promise<unknown>;
}
