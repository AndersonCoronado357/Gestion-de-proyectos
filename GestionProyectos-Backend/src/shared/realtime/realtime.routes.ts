// Ruta SSE.
//
//   GET /api/events?channels=navigation,foo
//
// EventSource (la API del navegador) no soporta headers custom, así que
// la autenticación no puede usar `Authorization: Bearer`.  Pero EventSource
// SÍ manda cookies con `withCredentials: true`, así que aprovechamos la
// cookie HttpOnly del refresh token para identificar la sesión: la
// verificamos contra la tabla sessions (igual que /auth/refresh) y, si
// pasa, abrimos el stream.  No rotamos nada — sólo es un "ping de auth".

import { Router, type Request, type Response, type NextFunction } from 'express';
import { realtime } from './adapters/sse.adapter';
import {
  hashToken,
  verifyRefreshToken
} from '../../modules/auth/domain/token.service';

const AppError = require('../errors/app.error');
const env = require('../../config/env');
const TokenRepositoryImpl = require('../../modules/auth/adapters/exit/token.repository.impl');

// Si el front no especifica `channels=`, lo subscribimos a TODOS los
// canales que la app emite hoy.  Cualquier canal nuevo del backend hay
// que agregarlo acá — sino los clientes nunca van a recibir esos
// eventos (era el bug del real-time de la tabla de Usuarios).
const DEFAULT_CHANNELS = ['navigation', 'users', 'roles'];

function parseChannels(raw: unknown): string[] {
  if (typeof raw !== 'string' || raw.length === 0) return DEFAULT_CHANNELS;
  return raw
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
}

// Middleware SSE-friendly: lee la cookie refresh, valida la sesión en DB
// y deja `req.user.id`.  Tira 401 si algo está mal — el cliente puede
// reintentar luego de re-logearse.
function sseAuthMiddleware(tokenRepository: {
  findActiveByHash: (hash: string) => Promise<{ user_id: number } | undefined>;
}) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const cookieName = env.cookies.refreshName;
      const refreshToken = req.cookies?.[cookieName];
      if (typeof refreshToken !== 'string' || !refreshToken) {
        return next(AppError.unauthorized('Missing session cookie'));
      }
      let payload;
      try {
        payload = verifyRefreshToken(refreshToken, {
          secret: env.jwt.secret,
          accessExpiresIn: env.jwt.accessExpiresIn,
          refreshExpiresIn: env.jwt.refreshExpiresIn
        });
      } catch {
        return next(AppError.unauthorized('Invalid session'));
      }
      const session = await tokenRepository.findActiveByHash(hashToken(refreshToken));
      if (!session) return next(AppError.unauthorized('Session not found'));
      const userId = parseInt(payload.sub, 10);
      if (!Number.isFinite(userId) || session.user_id !== userId) {
        return next(AppError.unauthorized('Session mismatch'));
      }
      req.user = { id: userId };
      next();
    } catch (e) {
      next(e);
    }
  };
}

module.exports = (db: unknown) => {
  const tokenRepository = new TokenRepositoryImpl(db);
  const router = Router();

  router.get(
    '/',
    sseAuthMiddleware(tokenRepository),
    (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      // Nginx: que no buffereé respuestas — necesitamos flush inmediato.
      res.setHeader('X-Accel-Buffering', 'no');
      res.flushHeaders?.();

      // Mensaje inicial para confirmar que la conexión está viva.
      res.write(`event: ready\ndata: {}\n\n`);

      const channels = parseChannels(req.query.channels);
      const unsubscribers = channels.map((c) => realtime.subscribe(c, res));

      req.on('close', () => {
        unsubscribers.forEach((u) => u());
      });
    }
  );

  return router;
};
