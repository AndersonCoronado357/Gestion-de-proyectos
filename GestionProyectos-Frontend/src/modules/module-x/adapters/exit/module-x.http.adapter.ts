import { http } from '../../../../shared/utils/http.js';
import {
  ModuleXRepository,
  type PaginationInput,
  type PaginatedResult
} from '../../ports/module-x.repository.js';
import { ModuleX, type ModuleXData } from '../../domain/module-x.entity.js';
import type { CreateModuleXDto } from '../../dtos/create-module-x.dto.js';
import type { UpdateModuleXDto } from '../../dtos/update-module-x.dto.js';

const fromApi = (raw: ModuleXData | null): ModuleX =>
  new ModuleX(raw ?? {});

interface PaginatedApi {
  items: ModuleXData[];
  total: number;
  page: number;
  limit: number;
}

interface ModuleXHttpAdapterOptions {
  token?: string;
}

export class ModuleXHttpAdapter extends ModuleXRepository {
  private token: string | undefined;

  constructor({ token }: ModuleXHttpAdapterOptions = {}) {
    super();
    this.token = token;
  }

  async list({ page = 1, limit = 20 }: PaginationInput = {}): Promise<
    PaginatedResult<ModuleX>
  > {
    const data = await http<PaginatedApi>(
      `/module-x?page=${page}&limit=${limit}`
    );
    if (!data) {
      return { items: [], total: 0, page, limit };
    }
    return { ...data, items: data.items.map(fromApi) };
  }

  async getById(id: string): Promise<ModuleX> {
    return fromApi(await http<ModuleXData>(`/module-x/${id}`));
  }

  async create(payload: CreateModuleXDto): Promise<ModuleX> {
    return fromApi(
      await http<ModuleXData>('/module-x', {
        method: 'POST',
        body: payload,
        token: this.token
      })
    );
  }

  async update(id: string, payload: UpdateModuleXDto): Promise<ModuleX> {
    return fromApi(
      await http<ModuleXData>(`/module-x/${id}`, {
        method: 'PUT',
        body: payload,
        token: this.token
      })
    );
  }

  async remove(id: string): Promise<unknown> {
    return http(`/module-x/${id}`, {
      method: 'DELETE',
      token: this.token
    });
  }
}
