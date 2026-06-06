import { http } from '../../../../shared/utils/http.js';
import {
  TryRepository,
  type PaginationInput,
  type PaginatedResult
} from '../../ports/try.repository.js';
import { Try, type TryData } from '../../domain/try.entity.js';
import type { CreateTryDto } from '../../dtos/create-try.dto.js';
import type { UpdateTryDto } from '../../dtos/update-try.dto.js';

const fromApi = (raw: TryData | null): Try =>
  new Try(raw ?? {});

interface PaginatedApi {
  items: TryData[];
  total: number;
  page: number;
  limit: number;
}

interface TryHttpAdapterOptions {
  token?: string;
}

export class TryHttpAdapter extends TryRepository {
  private token: string | undefined;

  constructor({ token }: TryHttpAdapterOptions = {}) {
    super();
    this.token = token;
  }

  async list({ page = 1, limit = 20 }: PaginationInput = {}): Promise<
    PaginatedResult<Try>
  > {
    const data = await http<PaginatedApi>(
      `/try?page=${page}&limit=${limit}`
    );
    if (!data) {
      return { items: [], total: 0, page, limit };
    }
    return { ...data, items: data.items.map(fromApi) };
  }

  async getById(id: string): Promise<Try> {
    return fromApi(await http<TryData>(`/try/${id}`));
  }

  async create(payload: CreateTryDto): Promise<Try> {
    return fromApi(
      await http<TryData>('/try', {
        method: 'POST',
        body: payload,
        token: this.token
      })
    );
  }

  async update(id: string, payload: UpdateTryDto): Promise<Try> {
    return fromApi(
      await http<TryData>(`/try/${id}`, {
        method: 'PUT',
        body: payload,
        token: this.token
      })
    );
  }

  async remove(id: string): Promise<unknown> {
    return http(`/try/${id}`, {
      method: 'DELETE',
      token: this.token
    });
  }
}
