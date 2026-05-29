// Use case: logout. Revoca la sesión asociada al refresh token actual.
// Si no hay token o no se encuentra la sesión, igual respondemos OK —
// el cliente queda deslogueado de su lado.

import { hashToken } from '../domain/token.service';
import type { TokenRepositoryPort } from '../ports/token.repository';
import { realtime } from '../../../shared/realtime/adapters/sse.adapter';

interface LogoutDeps {
  tokenRepository: TokenRepositoryPort;
}

interface LogoutInput {
  refreshToken?: string | null;
}

module.exports =
  ({ tokenRepository }: LogoutDeps) =>
  async ({ refreshToken }: LogoutInput): Promise<{ success: true }> => {
    if (refreshToken) {
      const session = await tokenRepository.findActiveByHash(hashToken(refreshToken));
      if (session) {
        await tokenRepository.revoke(session.id);
        // Delta granular por SSE: el usuario quedó sin sesión activa.
        // El front actualiza esa fila a "Sin iniciar sesión".
        realtime.broadcast('users', {
          type: 'session',
          userId: session.user_id,
          hasActiveSession: false
        });
      }
    }
    return { success: true };
  };
