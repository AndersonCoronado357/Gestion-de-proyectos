// Use case: heartbeat de actividad del usuario actual.
//
//   1. Updatea `last_activity_at = now()` en su fila de users.
//   2. Broadcastea por SSE al canal 'users' para que la tabla de
//      usuarios de otros clientes refresque la presence en vivo — sin
//      polling, sin refetch full.

import type { UserRepositoryPort } from '../../auth/ports/user.repository';
import { realtime } from '../../../shared/realtime/adapters/sse.adapter';

interface Deps {
  userRepository: UserRepositoryPort;
}

module.exports =
  ({ userRepository }: Deps) =>
  async ({ userId }: { userId: number }): Promise<void> => {
    const now = new Date();
    await userRepository.updateLastActivity(userId, now);
    realtime.broadcast('users', {
      type: 'activity',
      userId,
      lastActivityAt: now.toISOString()
    });
  };
