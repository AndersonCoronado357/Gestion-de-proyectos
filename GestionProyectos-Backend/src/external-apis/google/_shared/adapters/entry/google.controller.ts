// Controller del shared de Google: connect / status / disconnect.

import type { NextFunction, Request, Response } from 'express';
import type { GoogleAccountConnection } from '../../domain/google-token.types';
import type { ConnectionStatus } from '../../use-cases/getStatus';
import { isGoogleOAuthConfigured } from '../../config/oauth.config';

const AppError = require('../../../../../shared/errors/app.error');

interface UseCases {
  connect: (input: { userId: number; code: string }) => Promise<GoogleAccountConnection>;
  disconnect: (userId: number) => Promise<void>;
  getStatus: (userId: number) => Promise<ConnectionStatus>;
}

function requireUserId(req: Request): number {
  const id = req.user?.id;
  if (!id) throw AppError.unauthorized('Falta auth');
  return id;
}

module.exports = ({ useCases }: { useCases: UseCases }) => ({
  // Estado de la conexión del usuario — usado por la UI para decidir
  // si muestra "Conectar Google" o el panel del tester.
  status: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = requireUserId(req);
      const status = await useCases.getStatus(userId);
      res.json({
        ...status,
        oauthConfigured: isGoogleOAuthConfigured()
      });
    } catch (e) {
      next(e);
    }
  },

  // Recibe el code del consent popup y guarda el refresh cifrado.
  connect: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = requireUserId(req);
      if (!isGoogleOAuthConfigured()) {
        throw AppError.badRequest(
          'Falta configurar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en el backend.'
        );
      }
      const body = req.body as { code?: string };
      const code = String(body?.code ?? '').trim();
      if (!code) throw AppError.badRequest('Falta el authorization code.');
      const connection = await useCases.connect({ userId, code });
      res.status(201).json({ connected: true, connection });
    } catch (e) {
      next(e);
    }
  },

  // Borra la fila — el user pasa por consent de nuevo si quiere
  // reconectar.
  disconnect: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = requireUserId(req);
      await useCases.disconnect(userId);
      res.status(204).send();
    } catch (e) {
      next(e);
    }
  }
});
