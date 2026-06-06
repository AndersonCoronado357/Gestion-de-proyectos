import { http } from '../../../../shared/utils/http.js';
import {
  Anderson3Repository,
  type PaginationInput,
  type PaginatedResult
} from '../../ports/anderson3.repository.js';
import { Anderson3, type Anderson3Data } from '../../domain/anderson3.entity.js';
import type { CreateAnderson3Dto } from '../../dtos/create-anderson3.dto.js';
import type { UpdateAnderson3Dto } from '../../dtos/update-anderson3.dto.js';

const fromApi = (raw: Anderson3Data | null): Anderson3 =>
  new Anderson3(raw ?? {});

interface PaginatedApi {
  items: Anderson3Data[];
  total: number;
  page: number;
  limit: number;
}

interface Anderson3HttpAdapterOptions {
  token?: string;
}

export class Anderson3HttpAdapter extends Anderson3Repository {
  private token: string | undefined;

  constructor({ token }: Anderson3HttpAdapterOptions = {}) {
    super();
    this.token = token;
  }

  async list({ page = 1, limit = 20 }: PaginationInput = {}): Promise<
    PaginatedResult<Anderson3>
  > {
    const data = await http<PaginatedApi>(
      `/anderson3?page=${page}&limit=${limit}`
    );
    if (!data) {
      return { items: [], total: 0, page, limit };
    }
    return { ...data, items: data.items.map(fromApi) };
  }

  async getById(id: string): Promise<Anderson3> {
    return fromApi(await http<Anderson3Data>(`/anderson3/${id}`));
  }

  async create(payload: CreateAnderson3Dto): Promise<Anderson3> {
    return fromApi(
      await http<Anderson3Data>('/anderson3', {
        method: 'POST',
        body: payload,
        token: this.token
      })
    );
  }

  async update(id: string, payload: UpdateAnderson3Dto): Promise<Anderson3> {
    return fromApi(
      await http<Anderson3Data>(`/anderson3/${id}`, {
        method: 'PUT',
        body: payload,
        token: this.token
      })
    );
  }

  async remove(id: string): Promise<unknown> {
    return http(`/anderson3/${id}`, {
      method: 'DELETE',
      token: this.token
    });
  }
}
