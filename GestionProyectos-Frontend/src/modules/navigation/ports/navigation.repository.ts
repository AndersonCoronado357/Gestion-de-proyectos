import type { Navigation } from '../domain/navigation.entity.js';
import type { CreateNavigationDto } from '../dtos/create-navigation.dto.js';
import type { UpdateNavigationDto } from '../dtos/update-navigation.dto.js';

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

export abstract class NavigationRepository {
  abstract list(_pagination?: PaginationInput): Promise<PaginatedResult<Navigation>>;
  abstract getById(_id: string): Promise<Navigation>;
  abstract create(_data: CreateNavigationDto): Promise<Navigation>;
  abstract update(_id: string, _data: UpdateNavigationDto): Promise<Navigation>;
  abstract remove(_id: string): Promise<unknown>;
}
