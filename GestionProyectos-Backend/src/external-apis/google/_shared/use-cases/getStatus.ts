// Caso de uso: estado de la conexión de Google del usuario para mostrar
// en la UI ("Conectado como X" / "No conectado").
//
// Tratamos como NO conectado a un token guardado al que le faltan
// scopes — eso pasa cuando agregamos nuevas APIs (Calendar, Gmail, …)
// después de que el user ya conectó con Sheets+Drive. El frontend lo
// detecta y muestra el popup para re-consentir con los scopes nuevos.

import { getGoogleOAuthConfig } from '../config/oauth.config';
import type { GoogleAccountConnection } from '../domain/google-token.types';
import type { GoogleTokenRepository } from '../ports/google-token.repository';

export interface ConnectionStatus {
  connected: boolean;
  connection: GoogleAccountConnection | null;
  // Scopes que faltan en el token actual (vacío si está todo OK).
  missingScopes: string[];
}

export function getStatusUseCase(deps: { repo: GoogleTokenRepository }) {
  return async function getStatus(userId: number): Promise<ConnectionStatus> {
    const connection = await deps.repo.findByUserId(userId);
    if (!connection) {
      return { connected: false, connection: null, missingScopes: [] };
    }
    const required = getGoogleOAuthConfig().defaultScopes;
    const have = new Set(connection.scopes ?? []);
    const missingScopes = required.filter((s) => !have.has(s));
    // Si faltan scopes, lo reportamos como NO conectado para que el
    // frontend dispare el popup de re-consent automáticamente.
    return { connected: missingScopes.length === 0, connection, missingScopes };
  };
}
