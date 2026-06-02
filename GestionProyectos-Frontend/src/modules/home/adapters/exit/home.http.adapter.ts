import { http } from '../../../../shared/utils/http.js';
import {
  HomeRepository,
  type PaginationInput,
  type PaginatedResult
} from '../../ports/home.repository.js';
import { Home, type HomeData } from '../../domain/home.entity.js';
import type { CreateHomeDto } from '../../dtos/create-home.dto.js';
import type { UpdateHomeDto } from '../../dtos/update-home.dto.js';

const fromApi = (raw: HomeData | null): Home =>
  new Home(raw ?? {});

interface PaginatedApi {
  items: HomeData[];
  total: number;
  page: number;
  limit: number;
}

interface HomeHttpAdapterOptions {
  token?: string;
}

export class HomeHttpAdapter extends HomeRepository {
  private token: string | undefined;

  constructor({ token }: HomeHttpAdapterOptions = {}) {
    super();
    this.token = token;
  }

  async list({ page = 1, limit = 20 }: PaginationInput = {}): Promise<
    PaginatedResult<Home>
  > {
    const data = await http<PaginatedApi>(
      `/home?page=${page}&limit=${limit}`
    );
    if (!data) {
      return { items: [], total: 0, page, limit };
    }
    return { ...data, items: data.items.map(fromApi) };
  }

  async getById(id: string): Promise<Home> {
    return fromApi(await http<HomeData>(`/home/${id}`));
  }

  async create(payload: CreateHomeDto): Promise<Home> {
    return fromApi(
      await http<HomeData>('/home', {
        method: 'POST',
        body: payload,
        token: this.token
      })
    );
  }

  async update(id: string, payload: UpdateHomeDto): Promise<Home> {
    return fromApi(
      await http<HomeData>(`/home/${id}`, {
        method: 'PUT',
        body: payload,
        token: this.token
      })
    );
  }

  async remove(id: string): Promise<unknown> {
    return http(`/home/${id}`, {
      method: 'DELETE',
      token: this.token
    });
  }
}
