// Caso de uso: cerrar el flow "Conectar Google" del usuario.
//
// Recibe el authorization code del consent popup, lo intercambia con
// Google por tokens, y guarda el refresh cifrado en el repo.

import { exchangeCode } from '../adapters/exit/google-oauth.client';
import type { GoogleAccountConnection } from '../domain/google-token.types';
import type { GoogleTokenRepository } from '../ports/google-token.repository';

export interface ConnectAccountInput {
  userId: number;
  code: string;
}

export function connectAccountUseCase(deps: {
  repo: GoogleTokenRepository;
}) {
  return async function connectAccount(
    input: ConnectAccountInput
  ): Promise<GoogleAccountConnection> {
    const exchanged = await exchangeCode(input.code);
    return deps.repo.upsert({
      userId: input.userId,
      refreshToken: exchanged.refreshToken,
      scopes: exchanged.scopes,
      googleEmail: exchanged.googleEmail
    });
  };
}
