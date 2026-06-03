// Use case: ingestar uno o varios logs (típicamente del frontend en batch).
//
// Sanitiza cada entrada: descarta entradas con level/category/source inválido,
// trunca mensajes y limita el tamaño total de payload/context a 32 KB cada uno
// para no llenar la base con un solo dump enorme. Devuelve el conteo insertado.

import {
  LOG_CATEGORIES,
  LOG_LEVELS,
  LOG_SOURCES,
  type LogEntry
} from '../domain/log.types';
import type { LogRepositoryPort } from '../ports/log.repository';

interface Deps {
  logRepository: LogRepositoryPort;
}
interface Ctx {
  ip?: string;
  userAgent?: string;
  userId?: number;
  sessionId?: string;
}

const MAX_JSON_BYTES = 32_000;

function truncateJson(obj: unknown): Record<string, unknown> | null {
  if (obj == null) return null;
  if (typeof obj !== 'object') return { value: obj };
  try {
    const s = JSON.stringify(obj);
    if (s.length <= MAX_JSON_BYTES) return obj as Record<string, unknown>;
    return { _truncated: true, _preview: s.slice(0, MAX_JSON_BYTES) };
  } catch {
    return { _unserializable: true };
  }
}

function sanitize(raw: unknown, ctx: Ctx): LogEntry | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const level = String(r.level ?? '').toLowerCase();
  const category = String(r.category ?? '').toLowerCase();
  const source = String(r.source ?? 'frontend').toLowerCase();
  if (!(LOG_LEVELS as readonly string[]).includes(level)) return null;
  if (!(LOG_CATEGORIES as readonly string[]).includes(category)) return null;
  if (!(LOG_SOURCES as readonly string[]).includes(source)) return null;
  const occurredAt = typeof r.occurredAt === 'string' ? r.occurredAt : new Date().toISOString();
  return {
    occurredAt,
    level: level as LogEntry['level'],
    category: category as LogEntry['category'],
    source: source as LogEntry['source'],
    message: String(r.message ?? '').slice(0, 2000),
    loggerName: r.loggerName ? String(r.loggerName).slice(0, 120) : null,
    requestId: r.requestId ? String(r.requestId).slice(0, 48) : null,
    sessionId: (r.sessionId as string) || ctx.sessionId || null,
    traceId: r.traceId ? String(r.traceId).slice(0, 48) : null,
    userId: typeof r.userId === 'number' ? r.userId : ctx.userId ?? null,
    httpMethod: r.httpMethod ? String(r.httpMethod).slice(0, 10) : null,
    httpUrl: r.httpUrl ? String(r.httpUrl).slice(0, 1000) : null,
    httpStatus: typeof r.httpStatus === 'number' ? r.httpStatus : null,
    durationMs: typeof r.durationMs === 'number' ? r.durationMs : null,
    ip: ctx.ip ?? null,
    userAgent: ctx.userAgent ? ctx.userAgent.slice(0, 500) : null,
    route: r.route ? String(r.route).slice(0, 500) : null,
    stackTrace: r.stackTrace ? String(r.stackTrace).slice(0, 16_000) : null,
    context: truncateJson(r.context),
    payload: truncateJson(r.payload)
  };
}

module.exports =
  ({ logRepository }: Deps) =>
  async (raw: { entries: unknown[] }, ctx: Ctx): Promise<{ inserted: number }> => {
    if (!raw || !Array.isArray(raw.entries) || raw.entries.length === 0) {
      return { inserted: 0 };
    }
    // Tope para evitar abuso desde un cliente.
    const limited = raw.entries.slice(0, 500);
    const sanitized = limited.map((e) => sanitize(e, ctx)).filter((e): e is LogEntry => !!e);
    const inserted = await logRepository.insertMany(sanitized);
    return { inserted };
  };
