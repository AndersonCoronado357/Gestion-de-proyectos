import { http } from '../../../../shared/utils/http.js';
import {
  AndersonRepository,
  type PaginationInput,
  type PaginatedResult
} from '../../ports/anderson.repository.js';
import { Anderson, type AndersonData } from '../../domain/anderson.entity.js';
import type { CreateAndersonDto } from '../../dtos/create-anderson.dto.js';
import type { UpdateAndersonDto } from '../../dtos/update-anderson.dto.js';

const fromApi = (raw: AndersonData | null): Anderson =>
  new Anderson(raw ?? {});

interface PaginatedApi {
  items: AndersonData[];
  total: number;
  page: number;
  limit: number;
}

interface AndersonHttpAdapterOptions {
  token?: string;
}

export class AndersonHttpAdapter extends AndersonRepository {
  private token: string | undefined;

  constructor({ token }: AndersonHttpAdapterOptions = {}) {
    super();
    this.token = token;
  }

  async list({ page = 1, limit = 20 }: PaginationInput = {}): Promise<
    PaginatedResult<Anderson>
  > {
    const data = await http<PaginatedApi>(
      `/anderson?page=${page}&limit=${limit}`
    );
    if (!data) {
      return { items: [], total: 0, page, limit };
    }
    return { ...data, items: data.items.map(fromApi) };
  }

  async getById(id: string): Promise<Anderson> {
    return fromApi(await http<AndersonData>(`/anderson/${id}`));
  }

  async create(payload: CreateAndersonDto): Promise<Anderson> {
    return fromApi(
      await http<AndersonData>('/anderson', {
        method: 'POST',
        body: payload,
        token: this.token
      })
    );
  }

  async update(id: string, payload: UpdateAndersonDto): Promise<Anderson> {
    return fromApi(
      await http<AndersonData>(`/anderson/${id}`, {
        method: 'PUT',
        body: payload,
        token: this.token
      })
    );
  }

  async remove(id: string): Promise<unknown> {
    return http(`/anderson/${id}`, {
      method: 'DELETE',
      token: this.token
    });
  }
}
