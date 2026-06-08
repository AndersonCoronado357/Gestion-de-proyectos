// Caso de uso: desconectar Google del usuario — borra la fila del
// repo. NO revoca el refresh en Google (ese paso es opcional y
// requiere otra llamada HTTP; si querés revocación remota la sumamos
// después).

import type { GoogleTokenRepository } from '../ports/google-token.repository';

export function disconnectAccountUseCase(deps: {
  repo: GoogleTokenRepository;
}) {
  return async function disconnectAccount(userId: number): Promise<void> {
    await deps.repo.deleteByUserId(userId);
  };
}
