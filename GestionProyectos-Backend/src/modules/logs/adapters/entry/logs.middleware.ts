// Middleware: captura toda llamada HTTP que entra al backend.
//
// - Inyecta `req.requestId` (UUID corto) y lo devuelve en `x-request-id`.
// - Mide la duración.
// - Al terminar la respuesta, persiste un log con method/url/status/duration.
// - El error handler global registra excepciones aparte.
//
// Importante: el repositorio se inyecta una sola vez al montar.

import type { NextFunction, Request, Response } from 'express';
import crypto from 'node:crypto';
import type { LogEntry } from '../../domain/log.types';
import type { LogRepositoryPort } from '../../ports/log.repository';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
  }
}

function shortId(): string {
  return crypto.randomBytes(8).toString('hex');
}

// Evitamos crear ruido: no logueamos el endpoint de ingesta, health, ni el
// tráfico "de fondo" de la app (heartbeat de inactividad, SSE, refresh de
// tokens, lectura de la sesión, catálogo de iconos del navbar). De lo
// contrario, una pestaña abierta puede generar cientos de filas por hora
// sin valor diagnóstico.
const SKIP_PREFIXES: readonly string[] = [
  '/api/logs',
  '/api/me/activity',
  '/api/events',
  '/api/auth/refresh',
  '/api/auth/me',
  '/api/navigation/icons'
];
const SKIP_PATHS = new Set<string>(['/health']);
function isSkipped(p: string): boolean {
  if (SKIP_PATHS.has(p)) return true;
  for (const pref of SKIP_PREFIXES) if (p.startsWith(pref)) return true;
  return false;
}

export function buildLogsMiddleware(logRepository: LogRepositoryPort) {
  return function logsMiddleware(req: Request, res: Response, next: NextFunction): void {
    const id = (req.get('x-request-id') as string) || shortId();
    req.requestId = id;
    res.setHeader('x-request-id', id);

    if (isSkipped(req.path)) {
      next();
      return;
    }

    const start = Date.now();
    const occurredAt = new Date().toISOString();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const status = res.statusCode;
      const level: LogEntry['level'] =
        status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
      const entry: LogEntry = {
        occurredAt,
        level,
        category: 'http',
        source: 'backend',
        message: `${req.method} ${req.originalUrl} → ${status} (${duration}ms)`,
        requestId: id,
        userId: req.user?.id ?? null,
        sessionId: (req.get('x-session-id') as string) || null,
        httpMethod: req.method,
        httpUrl: req.originalUrl,
        httpStatus: status,
        durationMs: duration,
        ip: (req.ip || '').slice(0, 64),
        userAgent: req.get('user-agent') || null,
        route: req.route?.path || null
      };
      // Fire-and-forget: si el insert falla, no rompemos la request.
      logRepository.insert(entry).catch(() => undefined);
    });

    next();
  };
}
