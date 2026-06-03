// Cliente HTTP del módulo de logs.
//
// Endpoints:
//   POST /logs            ingesta batch (sin auth en frontend → captura
//                         pre-login también; el backend lee user si está)
//   GET  /logs            listado con filtros
//   GET  /logs/summary    KPIs cabecera
//   GET  /logs/:id        detalle + relacionados

import { http } from '../../shared/utils/http.js';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'audit';
export type LogCategory = 'http' | 'exception' | 'app' | 'audit' | 'console';
export type LogSource = 'frontend' | 'backend';

export interface RemoteLogEntry {
  id?: number;
  occurredAt: string;
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
  httpMethod?: string | null;
  httpUrl?: string | null;
  httpStatus?: number | null;
  durationMs?: number | null;
  ip?: string | null;
  userAgent?: string | null;
  route?: string | null;
  stackTrace?: string | null;
  context?: Record<string, unknown> | null;
  payload?: Record<string, unknown> | null;
}

export interface LogFilters {
  levels?: LogLevel[];
  sources?: LogSource[];
  categories?: LogCategory[];
  search?: string;
  from?: string;
  to?: string;
  requestId?: string;
  sessionId?: string;
  limit?: number;
  offset?: number;
}

export interface LogListResult {
  items: RemoteLogEntry[];
  total: number;
}

export interface LogSummary {
  total: number;
  last24h: number;
  errorsLast24h: number;
  byLevel: Record<LogLevel, number>;
  bySource: Record<LogSource, number>;
}

export interface LogDetail {
  entry: RemoteLogEntry;
  related: RemoteLogEntry[];
}

function toQuery(filters: LogFilters): string {
  const p = new URLSearchParams();
  if (filters.levels?.length) p.set('levels', filters.levels.join(','));
  if (filters.sources?.length) p.set('sources', filters.sources.join(','));
  if (filters.categories?.length) p.set('categories', filters.categories.join(','));
  if (filters.search) p.set('search', filters.search);
  if (filters.from) p.set('from', filters.from);
  if (filters.to) p.set('to', filters.to);
  if (filters.requestId) p.set('requestId', filters.requestId);
  if (filters.sessionId) p.set('sessionId', filters.sessionId);
  if (filters.limit) p.set('limit', String(filters.limit));
  if (filters.offset) p.set('offset', String(filters.offset));
  const s = p.toString();
  return s ? `?${s}` : '';
}

export async function ingestLogs(entries: RemoteLogEntry[]): Promise<void> {
  await http('/logs', { method: 'POST', body: { entries }, skipAuthRefresh: true });
}

export async function listLogs(filters: LogFilters = {}): Promise<LogListResult> {
  const data = await http<LogListResult>(`/logs${toQuery(filters)}`, { method: 'GET' });
  return data ?? { items: [], total: 0 };
}

export async function fetchLogSummary(): Promise<LogSummary | null> {
  return http<LogSummary>('/logs/summary', { method: 'GET' });
}

export async function fetchLogDetail(id: number): Promise<LogDetail | null> {
  return http<LogDetail>(`/logs/${id}`, { method: 'GET' });
}
