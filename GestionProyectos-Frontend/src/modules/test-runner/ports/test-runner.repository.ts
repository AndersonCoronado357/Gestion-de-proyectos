import type { TestRunner } from '../domain/test-runner.entity.js';
import type { CreateTestRunnerDto } from '../dtos/create-test-runner.dto.js';
import type { UpdateTestRunnerDto } from '../dtos/update-test-runner.dto.js';

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

export abstract class TestRunnerRepository {
  abstract list(_pagination?: PaginationInput): Promise<PaginatedResult<TestRunner>>;
  abstract getById(_id: string): Promise<TestRunner>;
  abstract create(_data: CreateTestRunnerDto): Promise<TestRunner>;
  abstract update(_id: string, _data: UpdateTestRunnerDto): Promise<TestRunner>;
  abstract remove(_id: string): Promise<unknown>;
}
