import type { PageBuilder } from '../domain/page-builder.entity.js';
import type { CreatePageBuilderDto } from '../dtos/create-page-builder.dto.js';
import type { UpdatePageBuilderDto } from '../dtos/update-page-builder.dto.js';

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

export abstract class PageBuilderRepository {
  abstract list(_pagination?: PaginationInput): Promise<PaginatedResult<PageBuilder>>;
  abstract getById(_id: string): Promise<PageBuilder>;
  abstract create(_data: CreatePageBuilderDto): Promise<PageBuilder>;
  abstract update(_id: string, _data: UpdatePageBuilderDto): Promise<PageBuilder>;
  abstract remove(_id: string): Promise<unknown>;
}
