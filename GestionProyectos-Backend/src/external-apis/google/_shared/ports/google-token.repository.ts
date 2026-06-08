// Puerto: persistencia de tokens de Google por usuario.
// La implementación real (Knex + cifrado AES-256-GCM) vive en
// adapters/exit/google-token.repository.impl.ts.

import type {
  GoogleAccountConnection,
  PersistTokenInput
} from '../domain/google-token.types';

export interface GoogleTokenRepository {
  // Crea o reemplaza la conexión del usuario. Si el user ya estaba
  // conectado, reemplaza el refresh y los scopes (reconectar = nuevo
  // consent).
  upsert(input: PersistTokenInput): Promise<GoogleAccountConnection>;

  // Lee la conexión sin exponer el refresh — para mostrar status en UI.
  findByUserId(userId: number): Promise<GoogleAccountConnection | null>;

  // Lee el refresh DESCIFRADO — sólo usado por el resolver de access
  // tokens, nunca expuesto en endpoints.
  findRefreshTokenByUserId(userId: number): Promise<string | null>;

  // Borra la conexión. El user puede reconectarse después.
  deleteByUserId(userId: number): Promise<void>;

  // Marca que se usó el refresh recién (para "Última actividad" en la
  // UI y diagnóstico).
  touchLastUsedAt(userId: number): Promise<void>;
}
