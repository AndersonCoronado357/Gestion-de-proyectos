// Implementación HTTP del GoogleConnectionRepository — pega contra
// /api/external-apis/google/{status,connect,disconnect}.

import { http } from '../../../../shared/utils/http.js';
import type { GoogleConnection, GoogleConnectionStatus } from '../../domain/google-connection.types.js';
import type { GoogleConnectionRepository } from '../../ports/google-connection.repository.js';

export const googleConnectionHttp: GoogleConnectionRepository = {
  async getStatus(): Promise<GoogleConnectionStatus | null> {
    return http<GoogleConnectionStatus>('/external-apis/google/status', {
      method: 'GET'
    });
  },

  async connect(
    authCode: string
  ): Promise<{ connected: boolean; connection: GoogleConnection } | null> {
    return http<{ connected: boolean; connection: GoogleConnection }>(
      '/external-apis/google/connect',
      { method: 'POST', body: { code: authCode } }
    );
  },

  async disconnect(): Promise<void> {
    await http('/external-apis/google/disconnect', { method: 'POST' });
  }
};
