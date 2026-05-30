// Cliente SSE.
//
//   - Una sola conexión EventSource para toda la app (multiplexamos los
//     canales en el server: cada canal viene como `event: <canal>`).
//   - Lazy connect: abrimos la conexión cuando aparece la primera
//     suscripción; la cerramos al irse el último suscriptor.
//   - Reconexión automática: la maneja `EventSource` por sí solo (hace
//     backoff).  En cada reconexión, re-attachamos los listeners porque
//     creamos un nuevo objeto.
//
// EventSource manda cookies sólo si pasamos `withCredentials: true`, que
// es como autenticamos contra `/api/events` (el server lee la cookie
// HttpOnly del refresh token).

import { env } from '../../../config/env.js';
import type {
  RealtimeHandler,
  RealtimePort
} from '../ports/realtime.port.js';

interface ChannelSubs {
  handlers: Set<RealtimeHandler>;
  listener: ((e: MessageEvent) => void) | null;
}

class SseClient implements RealtimePort {
  private source: EventSource | null = null;
  private channels = new Map<string, ChannelSubs>();

  subscribe<T>(channel: string, handler: RealtimeHandler<T>): () => void {
    let entry = this.channels.get(channel);
    if (!entry) {
      entry = { handlers: new Set(), listener: null };
      this.channels.set(channel, entry);
    }
    entry.handlers.add(handler as RealtimeHandler);

    this.ensureConnected();
    this.attachListener(channel);

    return () => {
      const e = this.channels.get(channel);
      if (!e) return;
      e.handlers.delete(handler as RealtimeHandler);
      if (e.handlers.size === 0) {
        if (e.listener && this.source) {
          this.source.removeEventListener(channel, e.listener);
        }
        this.channels.delete(channel);
      }
      if (this.channels.size === 0) this.disconnect();
    };
  }

  disconnect(): void {
    if (!this.source) return;
    this.source.close();
    this.source = null;
    // Limpiamos los listeners locales para que la próxima conexión
    // los recree desde cero.
    this.channels.forEach((entry) => {
      entry.listener = null;
    });
  }

  // ── helpers ────────────────────────────────────────────────────────

  private ensureConnected(): void {
    if (this.source) return;
    const url = `${env.apiBaseUrl}/events`;
    this.source = new EventSource(url, { withCredentials: true });
    this.source.onerror = () => {
      // EventSource reintenta solo; no hacemos nada.  Si la cookie
      // expiró, el server devolverá 401 y el browser seguirá
      // reintentando.  La salida limpia es llamar disconnect() desde
      // afuera (e.g. en signOut).
    };
    // Reattach listeners al objeto nuevo (en caso de un disconnect
    // explícito + reconnect por nueva subscribe).
    for (const channel of this.channels.keys()) this.attachListener(channel);
  }

  private attachListener(channel: string): void {
    const entry = this.channels.get(channel);
    if (!entry || !this.source) return;
    if (entry.listener) return;
    const listener = (e: MessageEvent) => {
      let payload: unknown = null;
      try {
        payload = JSON.parse(e.data);
      } catch {
        payload = e.data;
      }
      entry.handlers.forEach((h) => h(payload));
    };
    entry.listener = listener;
    this.source.addEventListener(channel, listener);
  }
}

// Singleton — toda la app pasa por la misma conexión.
export const realtimeClient: RealtimePort = new SseClient();
