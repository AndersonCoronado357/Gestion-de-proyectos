// Use case: resumen agregado para el header de la página de Logs.

import type { LogSummary } from '../domain/log.types';
import type { LogRepositoryPort } from '../ports/log.repository';

interface Deps {
  logRepository: LogRepositoryPort;
}

module.exports =
  ({ logRepository }: Deps) =>
  async (): Promise<LogSummary> => {
    return logRepository.summary();
  };
