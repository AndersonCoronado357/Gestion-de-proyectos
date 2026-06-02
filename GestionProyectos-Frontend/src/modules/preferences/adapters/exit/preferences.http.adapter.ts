import { http } from '../../../../shared/utils/http.js';
import {
  PreferencesRepository,
  type PaginationInput,
  type PaginatedResult
} from '../../ports/preferences.repository.js';
import { Preferences, type PreferencesData } from '../../domain/preferences.entity.js';
import type { CreatePreferencesDto } from '../../dtos/create-preferences.dto.js';
import type { UpdatePreferencesDto } from '../../dtos/update-preferences.dto.js';

const fromApi = (raw: PreferencesData | null): Preferences =>
  new Preferences(raw ?? {});

interface PaginatedApi {
  items: PreferencesData[];
  total: number;
  page: number;
  limit: number;
}

interface PreferencesHttpAdapterOptions {
  token?: string;
}

export class PreferencesHttpAdapter extends PreferencesRepository {
  private token: string | undefined;

  constructor({ token }: PreferencesHttpAdapterOptions = {}) {
    super();
    this.token = token;
  }

  async list({ page = 1, limit = 20 }: PaginationInput = {}): Promise<
    PaginatedResult<Preferences>
  > {
    const data = await http<PaginatedApi>(
      `/preferences?page=${page}&limit=${limit}`
    );
    if (!data) {
      return { items: [], total: 0, page, limit };
    }
    return { ...data, items: data.items.map(fromApi) };
  }

  async getById(id: string): Promise<Preferences> {
    return fromApi(await http<PreferencesData>(`/preferences/${id}`));
  }

  async create(payload: CreatePreferencesDto): Promise<Preferences> {
    return fromApi(
      await http<PreferencesData>('/preferences', {
        method: 'POST',
        body: payload,
        token: this.token
      })
    );
  }

  async update(id: string, payload: UpdatePreferencesDto): Promise<Preferences> {
    return fromApi(
      await http<PreferencesData>(`/preferences/${id}`, {
        method: 'PUT',
        body: payload,
        token: this.token
      })
    );
  }

  async remove(id: string): Promise<unknown> {
    return http(`/preferences/${id}`, {
      method: 'DELETE',
      token: this.token
    });
  }
}
