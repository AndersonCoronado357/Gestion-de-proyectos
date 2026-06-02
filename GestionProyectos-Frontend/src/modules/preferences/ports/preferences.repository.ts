import type { Preferences } from '../domain/preferences.entity.js';
import type { CreatePreferencesDto } from '../dtos/create-preferences.dto.js';
import type { UpdatePreferencesDto } from '../dtos/update-preferences.dto.js';

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

export abstract class PreferencesRepository {
  abstract list(_pagination?: PaginationInput): Promise<PaginatedResult<Preferences>>;
  abstract getById(_id: string): Promise<Preferences>;
  abstract create(_data: CreatePreferencesDto): Promise<Preferences>;
  abstract update(_id: string, _data: UpdatePreferencesDto): Promise<Preferences>;
  abstract remove(_id: string): Promise<unknown>;
}
