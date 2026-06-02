import { http } from '../../../../shared/utils/http.js';
import {
  PageBuilderRepository,
  type PaginationInput,
  type PaginatedResult
} from '../../ports/page-builder.repository.js';
import { PageBuilder, type PageBuilderData } from '../../domain/page-builder.entity.js';
import type { CreatePageBuilderDto } from '../../dtos/create-page-builder.dto.js';
import type { UpdatePageBuilderDto } from '../../dtos/update-page-builder.dto.js';

const fromApi = (raw: PageBuilderData | null): PageBuilder =>
  new PageBuilder(raw ?? {});

interface PaginatedApi {
  items: PageBuilderData[];
  total: number;
  page: number;
  limit: number;
}

interface PageBuilderHttpAdapterOptions {
  token?: string;
}

export class PageBuilderHttpAdapter extends PageBuilderRepository {
  private token: string | undefined;

  constructor({ token }: PageBuilderHttpAdapterOptions = {}) {
    super();
    this.token = token;
  }

  async list({ page = 1, limit = 20 }: PaginationInput = {}): Promise<
    PaginatedResult<PageBuilder>
  > {
    const data = await http<PaginatedApi>(
      `/page-builder?page=${page}&limit=${limit}`
    );
    if (!data) {
      return { items: [], total: 0, page, limit };
    }
    return { ...data, items: data.items.map(fromApi) };
  }

  async getById(id: string): Promise<PageBuilder> {
    return fromApi(await http<PageBuilderData>(`/page-builder/${id}`));
  }

  async create(payload: CreatePageBuilderDto): Promise<PageBuilder> {
    return fromApi(
      await http<PageBuilderData>('/page-builder', {
        method: 'POST',
        body: payload,
        token: this.token
      })
    );
  }

  async update(id: string, payload: UpdatePageBuilderDto): Promise<PageBuilder> {
    return fromApi(
      await http<PageBuilderData>(`/page-builder/${id}`, {
        method: 'PUT',
        body: payload,
        token: this.token
      })
    );
  }

  async remove(id: string): Promise<unknown> {
    return http(`/page-builder/${id}`, {
      method: 'DELETE',
      token: this.token
    });
  }
}
