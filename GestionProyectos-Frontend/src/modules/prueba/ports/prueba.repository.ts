import type { Prueba } from '../domain/prueba.entity.js';
import type { CreatePruebaDto } from '../dtos/create-prueba.dto.js';
import type { UpdatePruebaDto } from '../dtos/update-prueba.dto.js';

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

export abstract class PruebaRepository {
  abstract list(_pagination?: PaginationInput): Promise<PaginatedResult<Prueba>>;
  abstract getById(_id: string): Promise<Prueba>;
  abstract create(_data: CreatePruebaDto): Promise<Prueba>;
  abstract update(_id: string, _data: UpdatePruebaDto): Promise<Prueba>;
  abstract remove(_id: string): Promise<unknown>;
}
