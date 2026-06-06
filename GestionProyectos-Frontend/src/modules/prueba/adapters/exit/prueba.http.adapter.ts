import { http } from '../../../../shared/utils/http.js';
import {
  PruebaRepository,
  type PaginationInput,
  type PaginatedResult
} from '../../ports/prueba.repository.js';
import { Prueba, type PruebaData } from '../../domain/prueba.entity.js';
import type { CreatePruebaDto } from '../../dtos/create-prueba.dto.js';
import type { UpdatePruebaDto } from '../../dtos/update-prueba.dto.js';

const fromApi = (raw: PruebaData | null): Prueba =>
  new Prueba(raw ?? {});

interface PaginatedApi {
  items: PruebaData[];
  total: number;
  page: number;
  limit: number;
}

interface PruebaHttpAdapterOptions {
  token?: string;
}

export class PruebaHttpAdapter extends PruebaRepository {
  private token: string | undefined;

  constructor({ token }: PruebaHttpAdapterOptions = {}) {
    super();
    this.token = token;
  }

  async list({ page = 1, limit = 20 }: PaginationInput = {}): Promise<
    PaginatedResult<Prueba>
  > {
    const data = await http<PaginatedApi>(
      `/prueba?page=${page}&limit=${limit}`
    );
    if (!data) {
      return { items: [], total: 0, page, limit };
    }
    return { ...data, items: data.items.map(fromApi) };
  }

  async getById(id: string): Promise<Prueba> {
    return fromApi(await http<PruebaData>(`/prueba/${id}`));
  }

  async create(payload: CreatePruebaDto): Promise<Prueba> {
    return fromApi(
      await http<PruebaData>('/prueba', {
        method: 'POST',
        body: payload,
        token: this.token
      })
    );
  }

  async update(id: string, payload: UpdatePruebaDto): Promise<Prueba> {
    return fromApi(
      await http<PruebaData>(`/prueba/${id}`, {
        method: 'PUT',
        body: payload,
        token: this.token
      })
    );
  }

  async remove(id: string): Promise<unknown> {
    return http(`/prueba/${id}`, {
      method: 'DELETE',
      token: this.token
    });
  }
}
