import type { Hola } from '../domain/hola.entity.js';
import type { CreateHolaDto } from '../dtos/create-hola.dto.js';
import type { UpdateHolaDto } from '../dtos/update-hola.dto.js';

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

export abstract class HolaRepository {
  abstract list(_pagination?: PaginationInput): Promise<PaginatedResult<Hola>>;
  abstract getById(_id: string): Promise<Hola>;
  abstract create(_data: CreateHolaDto): Promise<Hola>;
  abstract update(_id: string, _data: UpdateHolaDto): Promise<Hola>;
  abstract remove(_id: string): Promise<unknown>;
}
