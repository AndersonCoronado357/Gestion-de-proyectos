// Use case: login real.
//
//   1. Busca al usuario por username (ignora soft-deletes).
//   2. Compara contraseña con bcrypt.
//   3. Verifica que el usuario esté ACTIVO (status = 1).
//   4. Genera par de tokens (access + refresh con jti).
//   5. Persiste sesión con SHA-256(refreshToken).
//   6. Actualiza last_login_at.
//   7. Devuelve { user, tokens }.
//
// El controller se encarga de setear la cookie HttpOnly con el refresh.

import bcrypt from 'bcryptjs';
import type {
  PublicUser,
  TokenPair,
  UserRow
} from '../domain/auth.types';
import { USER_STATUS } from '../domain/auth.types';
import {
  hashToken,
  issueTokenPair,
  toSeconds
} from '../domain/token.service';
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

interface LoginDeps {
  userRepository: UserRepositoryPort;
  tokenRepository: TokenRepositoryPort;
  // Opcional: si está, el login devuelve las preferencias para que el
  // front aplique el tema antes de pintar el dashboard (sin flash).
  preferencesRepository?: PreferencesRepositoryPort;
}

interface LoginInput {
  username: string;
  password: string;
  // `remember` lo aplica el controller (afecta las CookieOptions).  El
  // use case no lo necesita internamente pero aceptamos el campo para
  // que el controller pase el input del DTO tal cual.
  remember?: boolean;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface LoginOutput {
  user: PublicUser;
  tokens: TokenPair;
  preferences: UiPreferences;
}

module.exports =
  ({ userRepository, tokenRepository, preferencesRepository }: LoginDeps) =>
  async ({ username, password, ipAddress, userAgent }: LoginInput): Promise<LoginOutput> => {
    const row: UserRow | undefined = await userRepository.findByUsername(username);
    // Mensaje genérico para no filtrar si el usuario existe o no.
    if (!row) throw AppError.unauthorized('Invalid credentials');

    const ok = await bcrypt.compare(password, row.password_hash);
    if (!ok) throw AppError.unauthorized('Invalid credentials');

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

    // Trae roles/permisos para responder el "me" inmediatamente.
    const full = await userRepository.findWithAccessById(row.id);
    const user = toPublicUser(
      row,
      full?.roles ?? [],
      full?.permissions ?? [],
      full?.isSuper ?? false
    );

    // Preferencias en el mismo response → el front aplica el tema antes
    // de que React pinte el dashboard.
    let preferences: UiPreferences = DEFAULT_PREFERENCES;
    if (preferencesRepository) {
      try {
        const stored = await preferencesRepository.findByUserId(row.id);
        if (stored) preferences = stored;
      } catch {
        // Fallback a defaults — no es crítico para el login.
      }
    }

    // Delta granular por SSE: este usuario ahora tiene sesión activa
    // y acaba de hacer un heartbeat.  El front actualiza ESA fila — sin
    // refetch ni polling.
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
