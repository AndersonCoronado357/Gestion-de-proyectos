// Stub para una eventual implementación WebSocket que respete el mismo
// RealtimePort que SSE.  Por ahora la app usa SSE (ver sse.adapter.ts).

import type { RealtimePort, RealtimeHandler } from '../ports/realtime.port.js';

export class WebsocketAdapter implements RealtimePort {
  private url: string;
  private ws: WebSocket | null = null;

  constructor(url: string) {
    this.url = url;
  }

  subscribe<T>(_channel: string, _handler: RealtimeHandler<T>): () => void {
    throw new Error('WebsocketAdapter not implemented yet — using SSE');
  }

  disconnect(): void {
    this.ws?.close();
    this.ws = null;
  }
}
