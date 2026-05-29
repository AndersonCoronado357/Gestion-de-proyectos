// Port del servicio realtime. Define el contrato mínimo: registrar un
// cliente HTTP en un canal y broadcastear payloads a todos los clientes
// suscritos.
//
// Implementaciones posibles: SSE (lo que usamos), WebSocket, NATS, Redis
// pub/sub… cada una respeta esta misma interfaz, así los use-cases que
// "emiten eventos" no se enteran del transporte.

import type { Response } from 'express';

export interface RealtimePort {
  /** Suscribe la conexión HTTP `res` al canal y devuelve un unsubscriber. */
  subscribe(channel: string, res: Response): () => void;
  /** Empuja `payload` a todos los suscriptores del canal. */
  broadcast(channel: string, payload: unknown): void;
  /** Cierra todas las conexiones (graceful shutdown). */
  closeAll(): void;
}
