import { http } from '../../../../shared/utils/http.js';
import {
  AnderRepository,
  type PaginationInput,
  type PaginatedResult
} from '../../ports/ander.repository.js';
import { Ander, type AnderData } from '../../domain/ander.entity.js';
import type { CreateAnderDto } from '../../dtos/create-ander.dto.js';
import type { UpdateAnderDto } from '../../dtos/update-ander.dto.js';

const fromApi = (raw: AnderData | null): Ander =>
  new Ander(raw ?? {});

interface PaginatedApi {
  items: AnderData[];
  total: number;
  page: number;
  limit: number;
}

interface AnderHttpAdapterOptions {
  token?: string;
}

export class AnderHttpAdapter extends AnderRepository {
  private token: string | undefined;

  constructor({ token }: AnderHttpAdapterOptions = {}) {
    super();
    this.token = token;
  }

  async list({ page = 1, limit = 20 }: PaginationInput = {}): Promise<
    PaginatedResult<Ander>
  > {
    const data = await http<PaginatedApi>(
      `/ander?page=${page}&limit=${limit}`
    );
    if (!data) {
      return { items: [], total: 0, page, limit };
    }
    return { ...data, items: data.items.map(fromApi) };
  }

  async getById(id: string): Promise<Ander> {
    return fromApi(await http<AnderData>(`/ander/${id}`));
  }

  async create(payload: CreateAnderDto): Promise<Ander> {
    return fromApi(
      await http<AnderData>('/ander', {
        method: 'POST',
        body: payload,
        token: this.token
      })
    );
  }

  async update(id: string, payload: UpdateAnderDto): Promise<Ander> {
    return fromApi(
      await http<AnderData>(`/ander/${id}`, {
        method: 'PUT',
        body: payload,
        token: this.token
      })
    );
  }

  async remove(id: string): Promise<unknown> {
    return http(`/ander/${id}`, {
      method: 'DELETE',
      token: this.token
    });
  }
}
