// HTTP adapter del catálogo de cargos.

import { http } from '../../../../shared/utils/http.js';

export interface RemoteService {
  id: number;
  code: string;
  description: string;
  healthCenter: string | null;
}

interface ListResponse {
  services: RemoteService[];
}

export const servicesHttpAdapter = {
  async list(): Promise<RemoteService[]> {
    const data = await http<ListResponse>('/services', { method: 'GET' });
    return data?.services ?? [];
  }
};
