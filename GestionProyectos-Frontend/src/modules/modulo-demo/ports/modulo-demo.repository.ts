import type { ModuloDemo } from '../domain/modulo-demo.entity.js';
import type { CreateModuloDemoDto } from '../dtos/create-modulo-demo.dto.js';
import type { UpdateModuloDemoDto } from '../dtos/update-modulo-demo.dto.js';

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

export abstract class ModuloDemoRepository {
  abstract list(_pagination?: PaginationInput): Promise<PaginatedResult<ModuloDemo>>;
  abstract getById(_id: string): Promise<ModuloDemo>;
  abstract create(_data: CreateModuloDemoDto): Promise<ModuloDemo>;
  abstract update(_id: string, _data: UpdateModuloDemoDto): Promise<ModuloDemo>;
  abstract remove(_id: string): Promise<unknown>;
}
