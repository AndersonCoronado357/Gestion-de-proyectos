// Puerto: contrato del repositorio de logs.

import type {
  LogEntry,
  LogFilters,
  LogListResult,
  LogSummary
} from '../domain/log.types';

export interface LogRepositoryPort {
  insert(entry: LogEntry): Promise<number>;
  insertMany(entries: LogEntry[]): Promise<number>;
  findById(id: number): Promise<LogEntry | null>;
  list(filters: LogFilters): Promise<LogListResult>;
  summary(): Promise<LogSummary>;
  findRelated(
    by: { requestId?: string | null; sessionId?: string | null },
    excludeId: number,
    limit: number
  ): Promise<LogEntry[]>;
  purgeOlderThan(daysOld: number): Promise<number>;
}

// Clase abstracta para el patrón usado en el resto del proyecto.
class LogRepository {}
module.exports = LogRepository;
module.exports.default = LogRepository;
