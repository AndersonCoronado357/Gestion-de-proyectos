import { http } from '../../../../shared/utils/http.js';
import {
  LoginContentRepository,
  type PaginationInput,
  type PaginatedResult
} from '../../ports/login-content.repository.js';
import { LoginContent, type LoginContentData } from '../../domain/login-content.entity.js';
import type { CreateLoginContentDto } from '../../dtos/create-login-content.dto.js';
import type { UpdateLoginContentDto } from '../../dtos/update-login-content.dto.js';

const fromApi = (raw: LoginContentData | null): LoginContent =>
  new LoginContent(raw ?? {});

interface PaginatedApi {
  items: LoginContentData[];
  total: number;
  page: number;
  limit: number;
}

interface LoginContentHttpAdapterOptions {
  token?: string;
}

export class LoginContentHttpAdapter extends LoginContentRepository {
  private token: string | undefined;

  constructor({ token }: LoginContentHttpAdapterOptions = {}) {
    super();
    this.token = token;
  }

  async list({ page = 1, limit = 20 }: PaginationInput = {}): Promise<
    PaginatedResult<LoginContent>
  > {
    const data = await http<PaginatedApi>(
      `/login-content?page=${page}&limit=${limit}`
    );
    if (!data) {
      return { items: [], total: 0, page, limit };
    }
    return { ...data, items: data.items.map(fromApi) };
  }

  async getById(id: string): Promise<LoginContent> {
    return fromApi(await http<LoginContentData>(`/login-content/${id}`));
  }

  async create(payload: CreateLoginContentDto): Promise<LoginContent> {
    return fromApi(
      await http<LoginContentData>('/login-content', {
        method: 'POST',
        body: payload,
        token: this.token
      })
    );
  }

  async update(id: string, payload: UpdateLoginContentDto): Promise<LoginContent> {
    return fromApi(
      await http<LoginContentData>(`/login-content/${id}`, {
        method: 'PUT',
        body: payload,
        token: this.token
      })
    );
  }

  async remove(id: string): Promise<unknown> {
    return http(`/login-content/${id}`, {
      method: 'DELETE',
      token: this.token
    });
  }
}
