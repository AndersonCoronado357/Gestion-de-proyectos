// Middleware: verifica el access token (JWT, Bearer) y deja `req.user` con
// `{ id }` para que los controllers/use-cases lo usen.

import type { NextFunction, Request, Response } from 'express';
import {
  verifyAccessToken
} from '../../modules/auth/domain/token.service';

const AppError = require('../errors/app.error');
const env = require('../../config/env');

// Aumentamos Express.Request — para no usar `(req as any).user` en los handlers.
declare module 'express-serve-static-core' {
  interface Request {
    user?: { id: number };
  }
}

module.exports = (req: Request, _res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(AppError.unauthorized('Missing token'));
  }
  const token = header.slice(7).trim();
  try {
    const payload = verifyAccessToken(token, {
      secret: env.jwt.secret,
      accessExpiresIn: env.jwt.accessExpiresIn,
      refreshExpiresIn: env.jwt.refreshExpiresIn
    });
    const userId = parseInt(payload.sub, 10);
    if (!Number.isFinite(userId)) {
      return next(AppError.unauthorized('Invalid token payload'));
    }
    req.user = { id: userId };
    next();
  } catch {
    next(AppError.unauthorized('Invalid or expired token'));
  }
};
