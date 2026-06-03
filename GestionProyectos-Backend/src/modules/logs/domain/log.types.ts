// Tipos del dominio de logs.

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'audit';
export type LogCategory = 'http' | 'exception' | 'app' | 'audit' | 'console';
export type LogSource = 'frontend' | 'backend';

export const LOG_LEVELS: readonly LogLevel[] = ['error', 'warn', 'info', 'debug', 'audit'];
export const LOG_CATEGORIES: readonly LogCategory[] = [
  'http',
  'exception',
  'app',
  'audit',
  'console'
];
export const LOG_SOURCES: readonly LogSource[] = ['frontend', 'backend'];

/** Entrada de log canónica (la que circula por los use cases). */
export interface LogEntry {
  id?: number;
  occurredAt: string; // ISO
  receivedAt?: string;
  level: LogLevel;
  category: LogCategory;
  source: LogSource;
  message: string;
  loggerName?: string | null;
  requestId?: string | null;
  sessionId?: string | null;
  traceId?: string | null;
  userId?: number | null;
  // HTTP
  httpMethod?: string | null;
  httpUrl?: string | null;
  httpStatus?: number | null;
  durationMs?: number | null;
  // Cliente
  ip?: string | null;
  userAgent?: string | null;
  route?: string | null;
  // Payload
  stackTrace?: string | null;
  context?: Record<string, unknown> | null;
  payload?: Record<string, unknown> | null;
}

/** Filtros para listar logs. */
export interface LogFilters {
  levels?: LogLevel[];
  sources?: LogSource[];
  categories?: LogCategory[];
  search?: string;
  from?: string; // ISO
  to?: string; // ISO
  userId?: number;
  requestId?: string;
  sessionId?: string;
  limit?: number;
  offset?: number;
}

export interface LogListResult {
  items: LogEntry[];
  total: number;
}

/** Resumen agregado para el dashboard de la cabecera. */
export interface LogSummary {
  total: number;
  last24h: number;
  errorsLast24h: number;
  byLevel: Record<LogLevel, number>;
  bySource: Record<LogSource, number>;
}
