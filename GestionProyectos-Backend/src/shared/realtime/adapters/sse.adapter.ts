// SSE (Server-Sent Events) implementation del RealtimePort.
//
// El protocolo es muy simple: el server mantiene la conexión HTTP abierta
// y va escribiendo eventos en formato `data: <json>\n\n`. El navegador
// usa `EventSource` nativo, reconecta solo, y respeta cookies — esto
// último es clave porque autenticamos vía la cookie HttpOnly del refresh.
//
// Heartbeat cada 25s para que proxys (Nginx, CloudFlare) no cierren la
// conexión por inactividad.

import type { Response } from 'express';
import type { RealtimePort } from '../ports/realtime.port';

const HEARTBEAT_INTERVAL_MS = 25_000;

export class SseAdapter implements RealtimePort {
  // canal -> set de respuestas suscritas.  Usamos Set para tener O(1) en
  // el remove al cerrar la conexión.
  private subs = new Map<string, Set<Response>>();
  // ID monotónico para el campo `id:` del SSE — el navegador lo manda en
  // `Last-Event-ID` al reconectar (no lo usamos para replay, pero ayuda
  // a depurar).
  private nextId = 1;

  subscribe(channel: string, res: Response): () => void {
    let set = this.subs.get(channel);
    if (!set) {
      set = new Set();
      this.subs.set(channel, set);
    }
    set.add(res);

    const heartbeat = setInterval(() => {
      // ":" es un comentario SSE — no dispara onmessage en el cliente.
      try {
        res.write(': ping\n\n');
      } catch {
        // Conexión rota; el cierre real lo maneja `res.on('close')`.
      }
    }, HEARTBEAT_INTERVAL_MS);

    const unsubscribe = () => {
      clearInterval(heartbeat);
      set!.delete(res);
      if (set!.size === 0) this.subs.delete(channel);
    };

    // Cuando el cliente cierra (navegación, tab close, reload), Express
    // dispara 'close' en el response.
    res.on('close', unsubscribe);
    return unsubscribe;
  }

  broadcast(channel: string, payload: unknown): void {
    const set = this.subs.get(channel);
    if (!set || set.size === 0) return;
    const id = this.nextId++;
    const message =
      `id: ${id}\n` +
      `event: ${channel}\n` +
      `data: ${JSON.stringify(payload)}\n\n`;
    for (const res of set) {
      try {
        res.write(message);
      } catch {
        // Si write tira, la conexión se va a cerrar de cualquier modo y
        // el handler de 'close' la sacará del set.
      }
    }
  }

  closeAll(): void {
    for (const [, set] of this.subs) {
      for (const res of set) {
        try {
          res.end();
        } catch {
          // ignore
        }
      }
    }
    this.subs.clear();
  }
}

// Singleton compartido por toda la app — los use-cases lo importan acá.
export const realtime: RealtimePort = new SseAdapter();
