// Use case: refresh.
//
//   1. Verifica firma + expiración del refresh JWT.
//   2. Busca la sesión por SHA-256(refresh) — si no existe / está revocada
//      / está expirada en DB → 401.
//   3. Emite un access token nuevo y lo devuelve.
//
// NOTA: no rotamos el refresh token en cada refresh.
//   La rotación era vulnerable a races: si el usuario recargaba muchas
//   veces rápido, una recarga podía mandar la cookie vieja (porque la
//   nueva todavía no se había guardado en el browser) y el server la veía
//   ya rotada → 401 → kickback a /login.
//   Sin rotación, la cookie sigue siendo válida durante toda la vida de
//   la sesión (30 días) y los reloads son idempotentes.

import type { TokenPair } from '../domain/auth.types';
import {
  hashToken,
  signAccessToken,
  toSeconds,
  verifyRefreshToken
} from '../domain/token.service';
import type { TokenRepositoryPort } from '../ports/token.repository';
import type { UserRepositoryPort } from '../ports/user.repository';

const AppError = require('../../../shared/errors/app.error');
const env = require('../../../config/env');

interface RefreshDeps {
  userRepository: UserRepositoryPort;
  tokenRepository: TokenRepositoryPort;
}

interface RefreshInput {
  refreshToken: string;
}

module.exports =
  ({ userRepository, tokenRepository }: RefreshDeps) =>
  async ({ refreshToken }: RefreshInput): Promise<TokenPair> => {
    if (!refreshToken) throw AppError.unauthorized('Missing refresh token');

    const jwtConfig = {
      secret: env.jwt.secret,
      accessExpiresIn: env.jwt.accessExpiresIn,
      refreshExpiresIn: env.jwt.refreshExpiresIn
    };

    let payload;
    try {
      payload = verifyRefreshToken(refreshToken, jwtConfig);
    } catch {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    const session = await tokenRepository.findActiveByHash(hashToken(refreshToken));
    if (!session) throw AppError.unauthorized('Session not found or revoked');

    const userId = parseInt(payload.sub, 10);
    if (!Number.isFinite(userId) || session.user_id !== userId) {
      throw AppError.unauthorized('Refresh token does not match session');
    }

    const user = await userRepository.findById(userId);
    if (!user) throw AppError.unauthorized('User not found');

    const accessToken = signAccessToken(userId, jwtConfig);

    // El refresh token NO cambia. Lo devolvemos por consistencia con el
    // tipo TokenPair, pero el controller lo ignora (no re-setea la cookie).
    return {
      accessToken,
      refreshToken,
      expiresIn: toSeconds(env.jwt.accessExpiresIn),
      refreshExpiresIn: toSeconds(env.jwt.refreshExpiresIn)
    };
  };
