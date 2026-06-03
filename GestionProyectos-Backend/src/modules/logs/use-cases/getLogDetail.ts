// Use case: detalle de un log, con sus logs relacionados (mismo request_id
// o mismo session_id) para reconstruir el flujo en la vista detallada.

import type { LogEntry } from '../domain/log.types';
import type { LogRepositoryPort } from '../ports/log.repository';

interface Deps {
  logRepository: LogRepositoryPort;
}

interface LogDetail {
  entry: LogEntry;
  related: LogEntry[];
}

module.exports =
  ({ logRepository }: Deps) =>
  async ({ id }: { id: number }): Promise<LogDetail | null> => {
    const entry = await logRepository.findById(id);
    if (!entry) return null;
    const related = await logRepository.findRelated(
      { requestId: entry.requestId, sessionId: entry.sessionId },
      entry.id ?? id,
      50
    );
    return { entry, related };
  };
