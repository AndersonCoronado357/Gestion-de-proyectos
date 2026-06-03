// Use case: listar logs con filtros y paginación.

import type { LogFilters, LogListResult } from '../domain/log.types';
import type { LogRepositoryPort } from '../ports/log.repository';

interface Deps {
  logRepository: LogRepositoryPort;
}

module.exports =
  ({ logRepository }: Deps) =>
  async (filters: LogFilters): Promise<LogListResult> => {
    return logRepository.list(filters);
  };
