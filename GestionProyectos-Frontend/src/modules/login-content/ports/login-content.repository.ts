import type { LoginContent } from '../domain/login-content.entity.js';
import type { CreateLoginContentDto } from '../dtos/create-login-content.dto.js';
import type { UpdateLoginContentDto } from '../dtos/update-login-content.dto.js';

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

export abstract class LoginContentRepository {
  abstract list(_pagination?: PaginationInput): Promise<PaginatedResult<LoginContent>>;
  abstract getById(_id: string): Promise<LoginContent>;
  abstract create(_data: CreateLoginContentDto): Promise<LoginContent>;
  abstract update(_id: string, _data: UpdateLoginContentDto): Promise<LoginContent>;
  abstract remove(_id: string): Promise<unknown>;
}
