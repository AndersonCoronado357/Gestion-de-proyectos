// Port del cliente realtime.
//
// Forma minimalista pub/sub: te suscribís a un canal con un handler, te
// devuelve un unsubscriber.  El adapter abre la conexión sólo cuando
// alguien se suscribe y la cierra cuando ya no hay nadie.

export type RealtimeHandler<T = unknown> = (payload: T) => void;

export interface RealtimePort {
  subscribe<T = unknown>(channel: string, handler: RealtimeHandler<T>): () => void;
  disconnect(): void;
}
