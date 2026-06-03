// Captura AUTOMÁTICA de eventos hacia la bitácora.
//
//  1. window.onerror              → uncaught errors
//  2. unhandledrejection          → promesas rechazadas sin .catch
//  3. console.error / .warn       → logs proactivos del código (preserva el
//                                   comportamiento original — los seguimos
//                                   imprimiendo en consola).
//  4. fetch                       → cada request con method/url/status/ms y
//                                   payload de respuesta cuando falla.
//
// El hook se instala una sola vez (idempotente) al boot de la app.

import { appLog } from './logger.js';
import type { LogLevel } from './api.js';

let installed = false;

function stringifySafe(v: unknown, max = 4000): string {
  try {
    if (v == null) return '';
    if (typeof v === 'string') return v.slice(0, max);
    if (v instanceof Error) return v.stack ? v.stack.slice(0, max) : v.message;
    const s = JSON.stringify(v);
    return s.length > max ? s.slice(0, max) : s;
  } catch {
    return '[unserializable]';
  }
}

function viewportContext(): Record<string, unknown> {
  if (typeof window === 'undefined') return {};
  return {
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    dpr: window.devicePixelRatio,
    online: navigator.onLine
  };
}

export function installAutoCapture(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  // 1) Errores no manejados.
  window.addEventListener('error', (ev) => {
    const err = ev.error instanceof Error ? ev.error : null;
    appLog.error(err?.message ?? String(ev.message ?? 'window.onerror'), {
      category: 'exception',
      loggerName: 'window.onerror',
      stackTrace: err?.stack ?? null,
      context: {
        ...viewportContext(),
        filename: ev.filename,
        lineno: ev.lineno,
        colno: ev.colno
      }
    });
  });

  // 2) Promesas rechazadas.
  window.addEventListener('unhandledrejection', (ev) => {
    const reason = ev.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason
          : 'Unhandled promise rejection';
    appLog.error(message, {
      category: 'exception',
      loggerName: 'unhandledrejection',
      stackTrace: reason instanceof Error ? reason.stack ?? null : null,
      context: {
        ...viewportContext(),
        reason: stringifySafe(reason, 2000)
      }
    });
  });

  // 3) console.error / console.warn — preservar comportamiento, agregar al log.
  const wrap = (level: 'error' | 'warn', method: 'error' | 'warn'): void => {
    const original = console[method] as (...args: unknown[]) => void;
    console[method] = (...args: unknown[]) => {
      try {
        const message = args.map((a) => stringifySafe(a, 800)).join(' ').slice(0, 2000);
        const firstError = args.find((a) => a instanceof Error) as Error | undefined;
        appLog.log(level as LogLevel, 'console', message || `console.${method}`, {
          loggerName: `console.${method}`,
          stackTrace: firstError?.stack ?? null
        });
      } catch {
        // ignore
      }
      original.apply(console, args);
    };
  };
  wrap('error', 'error');
  wrap('warn', 'warn');

  // 4) Wrapper de fetch para registrar cada llamada HTTP del cliente.
  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const url =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.toString()
          : (input as Request).url;
    const method = (init?.method ?? (input instanceof Request ? input.method : 'GET') ?? 'GET')
      .toUpperCase();

    // Evitar bucle: no registramos el propio endpoint de logs.
    if (url.includes('/api/logs')) {
      return originalFetch(input, init);
    }

    const start = performance.now();
    const occurredAt = new Date().toISOString();
    try {
      const res = await originalFetch(input, init);
      const duration = Math.round(performance.now() - start);
      const status = res.status;
      const level: LogLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'info';
      appLog.log(level, 'http', `${method} ${url} → ${status} (${duration}ms)`, {
        loggerName: 'fetch',
        occurredAt,
        httpMethod: method,
        httpUrl: url,
        httpStatus: status,
        durationMs: duration,
        requestId: res.headers.get('x-request-id') ?? null
      });
      return res;
    } catch (e) {
      const duration = Math.round(performance.now() - start);
      const message = e instanceof Error ? e.message : 'Network error';
      appLog.error(`${method} ${url} → ${message}`, {
        category: 'http',
        loggerName: 'fetch',
        occurredAt,
        httpMethod: method,
        httpUrl: url,
        durationMs: duration,
        stackTrace: e instanceof Error ? e.stack ?? null : null
      });
      throw e;
    }
  };
}
