import { http } from '../../../../shared/utils/http.js';
import {
  ComponentsRepository,
  type PaginationInput,
  type PaginatedResult
} from '../../ports/components.repository.js';
import { Components, type ComponentsData } from '../../domain/components.entity.js';
import type { CreateComponentsDto } from '../../dtos/create-components.dto.js';
import type { UpdateComponentsDto } from '../../dtos/update-components.dto.js';

const fromApi = (raw: ComponentsData | null): Components =>
  new Components(raw ?? {});

interface PaginatedApi {
  items: ComponentsData[];
  total: number;
  page: number;
  limit: number;
}

interface ComponentsHttpAdapterOptions {
  token?: string;
}

export class ComponentsHttpAdapter extends ComponentsRepository {
  private token: string | undefined;

  constructor({ token }: ComponentsHttpAdapterOptions = {}) {
    super();
    this.token = token;
  }

  async list({ page = 1, limit = 20 }: PaginationInput = {}): Promise<
    PaginatedResult<Components>
  > {
    const data = await http<PaginatedApi>(
      `/components?page=${page}&limit=${limit}`
    );
    if (!data) {
      return { items: [], total: 0, page, limit };
    }
    return { ...data, items: data.items.map(fromApi) };
  }

  async getById(id: string): Promise<Components> {
    return fromApi(await http<ComponentsData>(`/components/${id}`));
  }

  async create(payload: CreateComponentsDto): Promise<Components> {
    return fromApi(
      await http<ComponentsData>('/components', {
        method: 'POST',
        body: payload,
        token: this.token
      })
    );
  }

  async update(id: string, payload: UpdateComponentsDto): Promise<Components> {
    return fromApi(
      await http<ComponentsData>(`/components/${id}`, {
        method: 'PUT',
        body: payload,
        token: this.token
      })
    );
  }

  async remove(id: string): Promise<unknown> {
    return http(`/components/${id}`, {
      method: 'DELETE',
      token: this.token
    });
  }
}
