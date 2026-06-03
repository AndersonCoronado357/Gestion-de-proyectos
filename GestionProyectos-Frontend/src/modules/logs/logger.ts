// Bitácora del frontend: API global para registrar eventos que se enviarán
// en batch al backend. Diseño "fire-and-forget" — cualquier parte de la app
// llama `appLog.error(...)` / `.info(...)` / `.audit(...)` sin esperar I/O.
//
// Batching:
//  - Buffer en memoria.
//  - Flush cada FLUSH_INTERVAL_MS, al alcanzar FLUSH_BATCH_SIZE, o cuando se
//    descarga la página (sendBeacon).
//  - Si el flush HTTP falla, los items se re-encolan para el siguiente intento
//    (con tope para no crecer indefinidamente).
//  - Si el batch tiene errores con `level:'error'` y la cola crece más allá del
//    tope, descartamos los más viejos NO-error antes que un error.

import { ingestLogs, type RemoteLogEntry, type LogCategory, type LogLevel } from './api.js';

const FLUSH_INTERVAL_MS = 4000;
const FLUSH_BATCH_SIZE = 25;
const QUEUE_HARD_LIMIT = 500;

let queue: RemoteLogEntry[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let sending = false;

// Session ID por carga del SPA → permite correlacionar eventos de UNA sesión.
const sessionId = (() => {
  try {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID().slice(0, 24);
    }
  } catch {
    // ignore
  }
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
})();

export function getSessionId(): string {
  return sessionId;
}

function scheduleFlush(): void {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    void flushNow();
  }, FLUSH_INTERVAL_MS);
}

export async function flushNow(): Promise<void> {
  if (sending || queue.length === 0) return;
  sending = true;
  const batch = queue.splice(0, queue.length);
  try {
    await ingestLogs(batch);
  } catch {
    // Re-encolar (al frente) hasta el tope, descartando NO-errores antiguos
    // si hay overflow.
    queue = batch.concat(queue);
    if (queue.length > QUEUE_HARD_LIMIT) {
      const errors = queue.filter((e) => e.level === 'error');
      const rest = queue.filter((e) => e.level !== 'error');
      const room = Math.max(0, QUEUE_HARD_LIMIT - errors.length);
      queue = errors.concat(rest.slice(-room));
    }
  } finally {
    sending = false;
  }
}

function getRoute(): string {
  if (typeof window === 'undefined') return '';
  return `${window.location.pathname}${window.location.search}`;
}

function getUserAgent(): string {
  if (typeof navigator === 'undefined') return '';
  return navigator.userAgent;
}

function enqueue(
  entry: Omit<Partial<RemoteLogEntry>, 'level' | 'category' | 'message'> & {
    level: RemoteLogEntry['level'];
    category: RemoteLogEntry['category'];
    message: string;
  }
): void {
  const occurredAt = entry.occurredAt ?? new Date().toISOString();
  const full: RemoteLogEntry = {
    ...entry,
    occurredAt,
    sessionId: entry.sessionId ?? sessionId,
    source: entry.source ?? 'frontend',
    route: entry.route ?? getRoute(),
    userAgent: entry.userAgent ?? getUserAgent()
  };
  queue.push(full);
  if (queue.length >= FLUSH_BATCH_SIZE) {
    void flushNow();
  } else {
    scheduleFlush();
  }
}

export interface AppLog {
  error(message: string, extras?: Partial<RemoteLogEntry>): void;
  warn(message: string, extras?: Partial<RemoteLogEntry>): void;
  info(message: string, extras?: Partial<RemoteLogEntry>): void;
  debug(message: string, extras?: Partial<RemoteLogEntry>): void;
  audit(message: string, extras?: Partial<RemoteLogEntry>): void;
  /** Genérico — útil para los wrappers automáticos (fetch, console, ...). */
  log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    extras?: Partial<RemoteLogEntry>
  ): void;
  flush(): Promise<void>;
  sessionId(): string;
}

export const appLog: AppLog = {
  error(message, extras) {
    enqueue({ level: 'error', category: extras?.category ?? 'app', message, ...extras });
  },
  warn(message, extras) {
    enqueue({ level: 'warn', category: extras?.category ?? 'app', message, ...extras });
  },
  info(message, extras) {
    enqueue({ level: 'info', category: extras?.category ?? 'app', message, ...extras });
  },
  debug(message, extras) {
    enqueue({ level: 'debug', category: extras?.category ?? 'app', message, ...extras });
  },
  audit(message, extras) {
    enqueue({ level: 'audit', category: 'audit', message, ...extras });
  },
  log(level, category, message, extras) {
    enqueue({ level, category, message, ...extras });
  },
  flush: flushNow,
  sessionId: getSessionId
};

// Flush al cerrar/recargar — sendBeacon sobrevive a navegaciones.
if (typeof window !== 'undefined') {
  const beaconFlush = (): void => {
    if (queue.length === 0) return;
    try {
      const body = JSON.stringify({ entries: queue });
      const url = `${
        (window as unknown as { __ENV_API__?: string }).__ENV_API__ ??
        '/api'
      }/logs`;
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: 'application/json' });
        navigator.sendBeacon(url, blob);
        queue = [];
      } else {
        void flushNow();
      }
    } catch {
      // ignore
    }
  };
  window.addEventListener('pagehide', beaconFlush);
  window.addEventListener('beforeunload', beaconFlush);
}
