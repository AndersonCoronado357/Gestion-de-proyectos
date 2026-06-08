// Caso de uso interno: dado un userId, devuelve un access token fresco
// listo para usar en `Authorization: Bearer ...` contra cualquier API
// de Google.
//
// Lo usan los módulos que dependen de Google (sheets, drive, etc.) — no
// hablan directo con el OAuth client, piden el access a este use case.

import { refreshAccessToken } from '../adapters/exit/google-oauth.client';
import type { ResolvedAccessToken } from '../domain/google-token.types';
import type { GoogleTokenRepository } from '../ports/google-token.repository';

const AppError = require('../../../../shared/errors/app.error');

export function resolveAccessTokenUseCase(deps: {
  repo: GoogleTokenRepository;
}) {
  return async function resolveAccessToken(
    userId: number
  ): Promise<ResolvedAccessToken> {
    const refresh = await deps.repo.findRefreshTokenByUserId(userId);
    if (!refresh) {
      throw AppError.badRequest(
        'No hay cuenta de Google conectada — primero conectá Google en /apis/google.'
      );
    }
    let result;
    try {
      result = await refreshAccessToken(refresh);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'No se pudo refrescar el token de Google';
      throw AppError.badRequest(msg);
    }
    // Tocamos last_used_at en background — no esperamos el update para
    // no agregar latencia al request principal.
    void deps.repo.touchLastUsedAt(userId).catch(() => undefined);
    // Releemos los scopes del repo (no vienen en el refresh response).
    const conn = await deps.repo.findByUserId(userId);
    return {
      accessToken: result.accessToken,
      expiresAt: result.expiresAt,
      scopes: conn?.scopes ?? []
    };
  };
}
