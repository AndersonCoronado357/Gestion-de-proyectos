import { http } from '../../../../shared/utils/http.js';
import {
  Anderson2Repository,
  type PaginationInput,
  type PaginatedResult
} from '../../ports/anderson2.repository.js';
import { Anderson2, type Anderson2Data } from '../../domain/anderson2.entity.js';
import type { CreateAnderson2Dto } from '../../dtos/create-anderson2.dto.js';
import type { UpdateAnderson2Dto } from '../../dtos/update-anderson2.dto.js';

const fromApi = (raw: Anderson2Data | null): Anderson2 =>
  new Anderson2(raw ?? {});

interface PaginatedApi {
  items: Anderson2Data[];
  total: number;
  page: number;
  limit: number;
}

interface Anderson2HttpAdapterOptions {
  token?: string;
}

export class Anderson2HttpAdapter extends Anderson2Repository {
  private token: string | undefined;

  constructor({ token }: Anderson2HttpAdapterOptions = {}) {
    super();
    this.token = token;
  }

  async list({ page = 1, limit = 20 }: PaginationInput = {}): Promise<
    PaginatedResult<Anderson2>
  > {
    const data = await http<PaginatedApi>(
      `/anderson2?page=${page}&limit=${limit}`
    );
    if (!data) {
      return { items: [], total: 0, page, limit };
    }
    return { ...data, items: data.items.map(fromApi) };
  }

  async getById(id: string): Promise<Anderson2> {
    return fromApi(await http<Anderson2Data>(`/anderson2/${id}`));
  }

  async create(payload: CreateAnderson2Dto): Promise<Anderson2> {
    return fromApi(
      await http<Anderson2Data>('/anderson2', {
        method: 'POST',
        body: payload,
        token: this.token
      })
    );
  }

  async update(id: string, payload: UpdateAnderson2Dto): Promise<Anderson2> {
    return fromApi(
      await http<Anderson2Data>(`/anderson2/${id}`, {
        method: 'PUT',
        body: payload,
        token: this.token
      })
    );
  }

  async remove(id: string): Promise<unknown> {
    return http(`/anderson2/${id}`, {
      method: 'DELETE',
      token: this.token
    });
  }
}
