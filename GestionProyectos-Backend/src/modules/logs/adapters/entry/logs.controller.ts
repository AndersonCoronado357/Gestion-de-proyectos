// Controller HTTP del módulo "logs".

import type { NextFunction, Request, Response } from 'express';
import type {
  LogCategory,
  LogEntry,
  LogFilters,
  LogLevel,
  LogListResult,
  LogSource,
  LogSummary
} from '../../domain/log.types';
import { LOG_CATEGORIES, LOG_LEVELS, LOG_SOURCES } from '../../domain/log.types';

interface UseCases {
  ingestLogs: (
    raw: { entries: unknown[] },
    ctx: { ip?: string; userAgent?: string; userId?: number; sessionId?: string }
  ) => Promise<{ inserted: number }>;
  listLogs: (filters: LogFilters) => Promise<LogListResult>;
  getLogDetail: (input: {
    id: number;
  }) => Promise<{ entry: LogEntry; related: LogEntry[] } | null>;
  getSummary: () => Promise<LogSummary>;
}

function parseCsv<T extends string>(raw: unknown, allowed: readonly T[]): T[] | undefined {
  if (typeof raw !== 'string' || !raw) return undefined;
  const parts = raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s): s is T => (allowed as readonly string[]).includes(s));
  return parts.length ? parts : undefined;
}

module.exports = ({ useCases }: { useCases: UseCases }) => ({
  ingest: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const ctx = {
        ip: (req.ip || req.socket.remoteAddress || '').slice(0, 64),
        userAgent: req.get('user-agent') || undefined,
        userId: req.user?.id,
        sessionId: (req.get('x-session-id') as string) || undefined
      };
      const result = await useCases.ingestLogs(req.body as { entries: unknown[] }, ctx);
      res.status(201).json(result);
    } catch (e) {
      next(e);
    }
  },

  list: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const q = req.query;
      const filters: LogFilters = {
        levels: parseCsv<LogLevel>(q.levels, LOG_LEVELS),
        sources: parseCsv<LogSource>(q.sources, LOG_SOURCES),
        categories: parseCsv<LogCategory>(q.categories, LOG_CATEGORIES),
        search: typeof q.search === 'string' && q.search ? q.search : undefined,
        from: typeof q.from === 'string' ? q.from : undefined,
        to: typeof q.to === 'string' ? q.to : undefined,
        userId: q.userId ? Number(q.userId) : undefined,
        requestId: typeof q.requestId === 'string' ? q.requestId : undefined,
        sessionId: typeof q.sessionId === 'string' ? q.sessionId : undefined,
        limit: q.limit ? Number(q.limit) : undefined,
        offset: q.offset ? Number(q.offset) : undefined
      };
      const result = await useCases.listLogs(filters);
      res.json(result);
    } catch (e) {
      next(e);
    }
  },

  detail: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        res.status(400).json({ error: 'INVALID_ID' });
        return;
      }
      const detail = await useCases.getLogDetail({ id });
      if (!detail) {
        res.status(404).json({ error: 'NOT_FOUND' });
        return;
      }
      res.json(detail);
    } catch (e) {
      next(e);
    }
  },

  summary: async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const summary = await useCases.getSummary();
      res.json(summary);
    } catch (e) {
      next(e);
    }
  }
});
