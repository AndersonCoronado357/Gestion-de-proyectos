import { http } from '../../../../shared/utils/http.js';
import {
  NavigationRepository,
  type PaginationInput,
  type PaginatedResult
} from '../../ports/navigation.repository.js';
import { Navigation, type NavigationData } from '../../domain/navigation.entity.js';
import type { CreateNavigationDto } from '../../dtos/create-navigation.dto.js';
import type { UpdateNavigationDto } from '../../dtos/update-navigation.dto.js';

const fromApi = (raw: NavigationData | null): Navigation =>
  new Navigation(raw ?? {});

interface PaginatedApi {
  items: NavigationData[];
  total: number;
  page: number;
  limit: number;
}

interface NavigationHttpAdapterOptions {
  token?: string;
}

export class NavigationHttpAdapter extends NavigationRepository {
  private token: string | undefined;

  constructor({ token }: NavigationHttpAdapterOptions = {}) {
    super();
    this.token = token;
  }

  async list({ page = 1, limit = 20 }: PaginationInput = {}): Promise<
    PaginatedResult<Navigation>
  > {
    const data = await http<PaginatedApi>(
      `/navigation?page=${page}&limit=${limit}`
    );
    if (!data) {
      return { items: [], total: 0, page, limit };
    }
    return { ...data, items: data.items.map(fromApi) };
  }

  async getById(id: string): Promise<Navigation> {
    return fromApi(await http<NavigationData>(`/navigation/${id}`));
  }

  async create(payload: CreateNavigationDto): Promise<Navigation> {
    return fromApi(
      await http<NavigationData>('/navigation', {
        method: 'POST',
        body: payload,
        token: this.token
      })
    );
  }

  async update(id: string, payload: UpdateNavigationDto): Promise<Navigation> {
    return fromApi(
      await http<NavigationData>(`/navigation/${id}`, {
        method: 'PUT',
        body: payload,
        token: this.token
      })
    );
  }

  async remove(id: string): Promise<unknown> {
    return http(`/navigation/${id}`, {
      method: 'DELETE',
      token: this.token
    });
  }
}
