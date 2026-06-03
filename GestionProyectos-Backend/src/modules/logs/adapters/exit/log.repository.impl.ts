// Implementación Knex (SQL Server) del LogRepository.
//
// Estrategia:
//  - Inserts en batch para reducir round-trips desde el ingreso bulk del front.
//  - `payload_json` y `context_json` se serializan acá; el dominio trabaja
//    con objetos planos.
//  - Listado con filtros dinámicos + paginación; total con un COUNT en la
//    misma WHERE para que el cliente pueda hacer paginación real.

import type { Knex } from 'knex';
import type {
  LogCategory,
  LogEntry,
  LogFilters,
  LogLevel,
  LogListResult,
  LogSource,
  LogSummary
} from '../../domain/log.types';
import type { LogRepositoryPort } from '../../ports/log.repository';

const LogRepository = require('../../ports/log.repository');

interface LogRow {
  id: number;
  occurred_at: Date;
  received_at: Date;
  level: LogLevel;
  category: LogCategory;
  source: LogSource;
  message: string;
  logger_name: string | null;
  request_id: string | null;
  session_id: string | null;
  trace_id: string | null;
  user_id: number | null;
  http_method: string | null;
  http_url: string | null;
  http_status: number | null;
  duration_ms: number | null;
  ip: string | null;
  user_agent: string | null;
  route: string | null;
  stack_trace: string | null;
  context_json: string | null;
  payload_json: string | null;
}

function toEntry(row: LogRow): LogEntry {
  let context: Record<string, unknown> | null = null;
  let payload: Record<string, unknown> | null = null;
  if (row.context_json) {
    try {
      context = JSON.parse(row.context_json);
    } catch {
      context = { _raw: row.context_json };
    }
  }
  if (row.payload_json) {
    try {
      payload = JSON.parse(row.payload_json);
    } catch {
      payload = { _raw: row.payload_json };
    }
  }
  return {
    id: row.id,
    occurredAt: new Date(row.occurred_at).toISOString(),
    receivedAt: new Date(row.received_at).toISOString(),
    level: row.level,
    category: row.category,
    source: row.source,
    message: row.message,
    loggerName: row.logger_name,
    requestId: row.request_id,
    sessionId: row.session_id,
    traceId: row.trace_id,
    userId: row.user_id,
    httpMethod: row.http_method,
    httpUrl: row.http_url,
    httpStatus: row.http_status,
    durationMs: row.duration_ms,
    ip: row.ip,
    userAgent: row.user_agent,
    route: row.route,
    stackTrace: row.stack_trace,
    context,
    payload
  };
}

function toRow(e: LogEntry): Record<string, unknown> {
  return {
    occurred_at: new Date(e.occurredAt),
    level: e.level,
    category: e.category,
    source: e.source,
    message: (e.message ?? '').slice(0, 2000),
    logger_name: e.loggerName ?? null,
    request_id: e.requestId ?? null,
    session_id: e.sessionId ?? null,
    trace_id: e.traceId ?? null,
    user_id: e.userId ?? null,
    http_method: e.httpMethod ?? null,
    http_url: e.httpUrl ? e.httpUrl.slice(0, 1000) : null,
    http_status: e.httpStatus ?? null,
    duration_ms: e.durationMs ?? null,
    ip: e.ip ?? null,
    user_agent: e.userAgent ? e.userAgent.slice(0, 500) : null,
    route: e.route ? e.route.slice(0, 500) : null,
    stack_trace: e.stackTrace ?? null,
    context_json: e.context ? JSON.stringify(e.context) : null,
    payload_json: e.payload ? JSON.stringify(e.payload) : null
  };
}

function applyFilters(qb: Knex.QueryBuilder, f: LogFilters): Knex.QueryBuilder {
  if (f.levels?.length) qb.whereIn('level', f.levels);
  if (f.sources?.length) qb.whereIn('source', f.sources);
  if (f.categories?.length) qb.whereIn('category', f.categories);
  if (f.from) qb.where('occurred_at', '>=', new Date(f.from));
  if (f.to) qb.where('occurred_at', '<=', new Date(f.to));
  if (typeof f.userId === 'number') qb.where('user_id', f.userId);
  if (f.requestId) qb.where('request_id', f.requestId);
  if (f.sessionId) qb.where('session_id', f.sessionId);
  if (f.search) {
    const s = `%${f.search}%`;
    qb.where((q) => {
      q.where('message', 'like', s)
        .orWhere('http_url', 'like', s)
        .orWhere('logger_name', 'like', s)
        .orWhere('stack_trace', 'like', s);
    });
  }
  return qb;
}

class LogRepositoryImpl extends LogRepository implements LogRepositoryPort {
  private db: Knex;
  private table = 'app_logs';

  constructor(db: Knex) {
    super();
    this.db = db;
  }

  async insert(entry: LogEntry): Promise<number> {
    const [row] = await this.db(this.table).insert(toRow(entry)).returning('id');
    const id = typeof row === 'number' ? row : (row as { id: number })?.id;
    return id ?? 0;
  }

  async insertMany(entries: LogEntry[]): Promise<number> {
    if (entries.length === 0) return 0;
    // Chunk en grupos de 200 para no exceder el límite de parámetros de mssql.
    let inserted = 0;
    for (let i = 0; i < entries.length; i += 200) {
      const slice = entries.slice(i, i + 200).map(toRow);
      await this.db(this.table).insert(slice);
      inserted += slice.length;
    }
    return inserted;
  }

  async findById(id: number): Promise<LogEntry | null> {
    const row = await this.db<LogRow>(this.table).where({ id }).first();
    return row ? toEntry(row) : null;
  }

  async list(filters: LogFilters): Promise<LogListResult> {
    const limit = Math.min(Math.max(filters.limit ?? 100, 1), 500);
    const offset = Math.max(filters.offset ?? 0, 0);

    const itemsQ = applyFilters(this.db<LogRow>(this.table).select('*'), filters)
      .orderBy('occurred_at', 'desc')
      .orderBy('id', 'desc')
      .limit(limit)
      .offset(offset);

    const totalQ = applyFilters(
      this.db<LogRow>(this.table).count<{ c: number }[]>({ c: '*' }),
      filters
    );

    const [rows, totalRows] = await Promise.all([itemsQ, totalQ]);
    const total = Number((totalRows[0] as { c: number | string } | undefined)?.c ?? 0);
    return { items: rows.map(toEntry), total };
  }

  async summary(): Promise<LogSummary> {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const [{ total }] = (await this.db(this.table).count<{ total: number | string }[]>({
      total: '*'
    })) as Array<{ total: number | string }>;
    const [{ last24h }] = (await this.db(this.table)
      .where('occurred_at', '>=', since)
      .count<{ last24h: number | string }[]>({
        last24h: '*'
      })) as Array<{ last24h: number | string }>;
    const [{ errorsLast24h }] = (await this.db(this.table)
      .where('occurred_at', '>=', since)
      .where('level', 'error')
      .count<{ errorsLast24h: number | string }[]>({
        errorsLast24h: '*'
      })) as Array<{ errorsLast24h: number | string }>;
    const byLevelRows = (await this.db(this.table)
      .select('level')
      .count<{ level: LogLevel; c: number | string }[]>({ c: '*' })
      .groupBy('level')) as Array<{ level: LogLevel; c: number | string }>;
    const bySourceRows = (await this.db(this.table)
      .select('source')
      .count<{ source: LogSource; c: number | string }[]>({ c: '*' })
      .groupBy('source')) as Array<{ source: LogSource; c: number | string }>;
    const byLevel: Record<LogLevel, number> = {
      error: 0,
      warn: 0,
      info: 0,
      debug: 0,
      audit: 0
    };
    for (const r of byLevelRows) byLevel[r.level] = Number(r.c);
    const bySource: Record<LogSource, number> = { frontend: 0, backend: 0 };
    for (const r of bySourceRows) bySource[r.source] = Number(r.c);
    return {
      total: Number(total),
      last24h: Number(last24h),
      errorsLast24h: Number(errorsLast24h),
      byLevel,
      bySource
    };
  }

  async findRelated(
    by: { requestId?: string | null; sessionId?: string | null },
    excludeId: number,
    limit: number
  ): Promise<LogEntry[]> {
    if (!by.requestId && !by.sessionId) return [];
    const rows = await this.db<LogRow>(this.table)
      .where((q) => {
        if (by.requestId) q.orWhere('request_id', by.requestId);
        if (by.sessionId) q.orWhere('session_id', by.sessionId);
      })
      .whereNot('id', excludeId)
      .orderBy('occurred_at', 'asc')
      .limit(Math.min(Math.max(limit, 1), 100));
    return rows.map(toEntry);
  }

  async purgeOlderThan(daysOld: number): Promise<number> {
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    return this.db(this.table).where('occurred_at', '<', cutoff).del();
  }
}

module.exports = LogRepositoryImpl;
module.exports.default = LogRepositoryImpl;
