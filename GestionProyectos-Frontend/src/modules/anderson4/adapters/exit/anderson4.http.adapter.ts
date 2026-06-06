import { http } from '../../../../shared/utils/http.js';
import {
  Anderson4Repository,
  type PaginationInput,
  type PaginatedResult
} from '../../ports/anderson4.repository.js';
import { Anderson4, type Anderson4Data } from '../../domain/anderson4.entity.js';
import type { CreateAnderson4Dto } from '../../dtos/create-anderson4.dto.js';
import type { UpdateAnderson4Dto } from '../../dtos/update-anderson4.dto.js';

const fromApi = (raw: Anderson4Data | null): Anderson4 =>
  new Anderson4(raw ?? {});

interface PaginatedApi {
  items: Anderson4Data[];
  total: number;
  page: number;
  limit: number;
}

interface Anderson4HttpAdapterOptions {
  token?: string;
}

export class Anderson4HttpAdapter extends Anderson4Repository {
  private token: string | undefined;

  constructor({ token }: Anderson4HttpAdapterOptions = {}) {
    super();
    this.token = token;
  }

  async list({ page = 1, limit = 20 }: PaginationInput = {}): Promise<
    PaginatedResult<Anderson4>
  > {
    const data = await http<PaginatedApi>(
      `/anderson4?page=${page}&limit=${limit}`
    );
    if (!data) {
      return { items: [], total: 0, page, limit };
    }
    return { ...data, items: data.items.map(fromApi) };
  }

  async getById(id: string): Promise<Anderson4> {
    return fromApi(await http<Anderson4Data>(`/anderson4/${id}`));
  }

  async create(payload: CreateAnderson4Dto): Promise<Anderson4> {
    return fromApi(
      await http<Anderson4Data>('/anderson4', {
        method: 'POST',
        body: payload,
        token: this.token
      })
    );
  }

  async update(id: string, payload: UpdateAnderson4Dto): Promise<Anderson4> {
    return fromApi(
      await http<Anderson4Data>(`/anderson4/${id}`, {
        method: 'PUT',
        body: payload,
        token: this.token
      })
    );
  }

  async remove(id: string): Promise<unknown> {
    return http(`/anderson4/${id}`, {
      method: 'DELETE',
      token: this.token
    });
  }
}
