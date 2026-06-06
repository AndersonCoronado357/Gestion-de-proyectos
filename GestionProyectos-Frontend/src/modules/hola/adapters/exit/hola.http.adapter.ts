import { http } from '../../../../shared/utils/http.js';
import {
  HolaRepository,
  type PaginationInput,
  type PaginatedResult
} from '../../ports/hola.repository.js';
import { Hola, type HolaData } from '../../domain/hola.entity.js';
import type { CreateHolaDto } from '../../dtos/create-hola.dto.js';
import type { UpdateHolaDto } from '../../dtos/update-hola.dto.js';

const fromApi = (raw: HolaData | null): Hola =>
  new Hola(raw ?? {});

interface PaginatedApi {
  items: HolaData[];
  total: number;
  page: number;
  limit: number;
}

interface HolaHttpAdapterOptions {
  token?: string;
}

export class HolaHttpAdapter extends HolaRepository {
  private token: string | undefined;

  constructor({ token }: HolaHttpAdapterOptions = {}) {
    super();
    this.token = token;
  }

  async list({ page = 1, limit = 20 }: PaginationInput = {}): Promise<
    PaginatedResult<Hola>
  > {
    const data = await http<PaginatedApi>(
      `/hola?page=${page}&limit=${limit}`
    );
    if (!data) {
      return { items: [], total: 0, page, limit };
    }
    return { ...data, items: data.items.map(fromApi) };
  }

  async getById(id: string): Promise<Hola> {
    return fromApi(await http<HolaData>(`/hola/${id}`));
  }

  async create(payload: CreateHolaDto): Promise<Hola> {
    return fromApi(
      await http<HolaData>('/hola', {
        method: 'POST',
        body: payload,
        token: this.token
      })
    );
  }

  async update(id: string, payload: UpdateHolaDto): Promise<Hola> {
    return fromApi(
      await http<HolaData>(`/hola/${id}`, {
        method: 'PUT',
        body: payload,
        token: this.token
      })
    );
  }

  async remove(id: string): Promise<unknown> {
    return http(`/hola/${id}`, {
      method: 'DELETE',
      token: this.token
    });
  }
}
