import { http } from '../../../../shared/utils/http.js';
import {
  ModuloDemoRepository,
  type PaginationInput,
  type PaginatedResult
} from '../../ports/modulo-demo.repository.js';
import { ModuloDemo, type ModuloDemoData } from '../../domain/modulo-demo.entity.js';
import type { CreateModuloDemoDto } from '../../dtos/create-modulo-demo.dto.js';
import type { UpdateModuloDemoDto } from '../../dtos/update-modulo-demo.dto.js';

const fromApi = (raw: ModuloDemoData | null): ModuloDemo =>
  new ModuloDemo(raw ?? {});

interface PaginatedApi {
  items: ModuloDemoData[];
  total: number;
  page: number;
  limit: number;
}

interface ModuloDemoHttpAdapterOptions {
  token?: string;
}

export class ModuloDemoHttpAdapter extends ModuloDemoRepository {
  private token: string | undefined;

  constructor({ token }: ModuloDemoHttpAdapterOptions = {}) {
    super();
    this.token = token;
  }

  async list({ page = 1, limit = 20 }: PaginationInput = {}): Promise<
    PaginatedResult<ModuloDemo>
  > {
    const data = await http<PaginatedApi>(
      `/modulo-demo?page=${page}&limit=${limit}`
    );
    if (!data) {
      return { items: [], total: 0, page, limit };
    }
    return { ...data, items: data.items.map(fromApi) };
  }

  async getById(id: string): Promise<ModuloDemo> {
    return fromApi(await http<ModuloDemoData>(`/modulo-demo/${id}`));
  }

  async create(payload: CreateModuloDemoDto): Promise<ModuloDemo> {
    return fromApi(
      await http<ModuloDemoData>('/modulo-demo', {
        method: 'POST',
        body: payload,
        token: this.token
      })
    );
  }

  async update(id: string, payload: UpdateModuloDemoDto): Promise<ModuloDemo> {
    return fromApi(
      await http<ModuloDemoData>(`/modulo-demo/${id}`, {
        method: 'PUT',
        body: payload,
        token: this.token
      })
    );
  }

  async remove(id: string): Promise<unknown> {
    return http(`/modulo-demo/${id}`, {
      method: 'DELETE',
      token: this.token
    });
  }
}
