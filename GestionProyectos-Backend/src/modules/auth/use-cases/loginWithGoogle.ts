// Use case: login con Google.
//
//   El controller ya verificó el ID token de Google y extrajo el email.
//   Acá: buscamos al usuario por email, validamos que esté activo, y
//   emitimos el par de tokens igual que el login normal.
//
//   Nota: NO auto-crea usuarios. El correo de Google debe coincidir con
//   el email de un usuario existente (creado por un admin). Así el acceso
//   sigue controlado por roles/permisos.

import type { PublicUser, TokenPair, UserRow } from '../domain/auth.types';
import { USER_STATUS } from '../domain/auth.types';
import { hashToken, issueTokenPair, toSeconds } from '../domain/token.service';
import { toPublicUser } from '../domain/user.mapper';
import type { TokenRepositoryPort } from '../ports/token.repository';
import type { UserRepositoryPort } from '../ports/user.repository';
import {
  DEFAULT_PREFERENCES,
  type UiPreferences
} from '../../me/domain/preferences.types';
import type { PreferencesRepositoryPort } from '../../me/ports/preferences.repository';
import { realtime } from '../../../shared/realtime/adapters/sse.adapter';

const AppError = require('../../../shared/errors/app.error');
const env = require('../../../config/env');

interface Deps {
  userRepository: UserRepositoryPort;
  tokenRepository: TokenRepositoryPort;
  preferencesRepository?: PreferencesRepositoryPort;
}

interface Input {
  email: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface LoginWithGoogleOutput {
  user: PublicUser;
  tokens: TokenPair;
  preferences: UiPreferences;
}

module.exports =
  ({ userRepository, tokenRepository, preferencesRepository }: Deps) =>
  async ({ email, ipAddress, userAgent }: Input): Promise<LoginWithGoogleOutput> => {
    const row: UserRow | undefined = await userRepository.findByEmail(email);
    if (!row) {
      throw AppError.unauthorized(
        'No hay un usuario registrado con ese correo de Google'
      );
    }
    if (row.status !== USER_STATUS.ACTIVE) {
      throw AppError.forbidden('User account is not active');
    }

    const jwtConfig = {
      secret: env.jwt.secret,
      accessExpiresIn: env.jwt.accessExpiresIn,
      refreshExpiresIn: env.jwt.refreshExpiresIn
    };
    const { accessToken, refreshToken, expiresIn, refreshExpiresIn } =
      issueTokenPair(row.id, jwtConfig);

    const expiresAt = new Date(
      Date.now() + toSeconds(env.jwt.refreshExpiresIn) * 1000
    );

    await tokenRepository.save({
      userId: row.id,
      tokenHash: hashToken(refreshToken),
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      expiresAt
    });

    await userRepository.updateLastLogin(row.id, new Date());

    const full = await userRepository.findWithAccessById(row.id);
    const user = toPublicUser(
      row,
      full?.roles ?? [],
      full?.permissions ?? [],
      full?.isSuper ?? false
    );

    let preferences: UiPreferences = DEFAULT_PREFERENCES;
    if (preferencesRepository) {
      try {
        const stored = await preferencesRepository.findByUserId(row.id);
        if (stored) preferences = stored;
      } catch {
        // Fallback a defaults — no crítico.
      }
    }

    realtime.broadcast('users', {
      type: 'session',
      userId: row.id,
      hasActiveSession: true,
      lastActivityAt: new Date().toISOString()
    });

    return {
      user,
      tokens: { accessToken, refreshToken, expiresIn, refreshExpiresIn },
      preferences
    };
  };
