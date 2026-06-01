import { http } from '../../../../shared/utils/http.js';
import {
  TestRunnerRepository,
  type PaginationInput,
  type PaginatedResult
} from '../../ports/test-runner.repository.js';
import { TestRunner, type TestRunnerData } from '../../domain/test-runner.entity.js';
import type { CreateTestRunnerDto } from '../../dtos/create-test-runner.dto.js';
import type { UpdateTestRunnerDto } from '../../dtos/update-test-runner.dto.js';

const fromApi = (raw: TestRunnerData | null): TestRunner =>
  new TestRunner(raw ?? {});

interface PaginatedApi {
  items: TestRunnerData[];
  total: number;
  page: number;
  limit: number;
}

interface TestRunnerHttpAdapterOptions {
  token?: string;
}

export class TestRunnerHttpAdapter extends TestRunnerRepository {
  private token: string | undefined;

  constructor({ token }: TestRunnerHttpAdapterOptions = {}) {
    super();
    this.token = token;
  }

  async list({ page = 1, limit = 20 }: PaginationInput = {}): Promise<
    PaginatedResult<TestRunner>
  > {
    const data = await http<PaginatedApi>(
      `/test-runner?page=${page}&limit=${limit}`
    );
    if (!data) {
      return { items: [], total: 0, page, limit };
    }
    return { ...data, items: data.items.map(fromApi) };
  }

  async getById(id: string): Promise<TestRunner> {
    return fromApi(await http<TestRunnerData>(`/test-runner/${id}`));
  }

  async create(payload: CreateTestRunnerDto): Promise<TestRunner> {
    return fromApi(
      await http<TestRunnerData>('/test-runner', {
        method: 'POST',
        body: payload,
        token: this.token
      })
    );
  }

  async update(id: string, payload: UpdateTestRunnerDto): Promise<TestRunner> {
    return fromApi(
      await http<TestRunnerData>(`/test-runner/${id}`, {
        method: 'PUT',
        body: payload,
        token: this.token
      })
    );
  }

  async remove(id: string): Promise<unknown> {
    return http(`/test-runner/${id}`, {
      method: 'DELETE',
      token: this.token
    });
  }
}
