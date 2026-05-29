// Port: contrato del TokenRepository (sesiones / refresh tokens).
//
// Importante: NUNCA persistimos el refresh token plano.  Sólo guardamos
// `token_hash = SHA-256(refreshToken)` para que un dump de DB no permita
// reusar tokens.

import type { SessionRow } from '../domain/auth.types';

export interface SaveSessionInput {
  userId: number;
  tokenHash: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  expiresAt: Date;
}

export interface TokenRepositoryPort {
  save(input: SaveSessionInput): Promise<SessionRow>;
  findActiveByHash(tokenHash: string): Promise<SessionRow | undefined>;
  revoke(id: number): Promise<void>;
  revokeAllForUser(userId: number): Promise<void>;
}

class TokenRepository implements TokenRepositoryPort {
  async save(_input: SaveSessionInput): Promise<SessionRow> {
    throw new Error('Not implemented');
  }
  async findActiveByHash(_tokenHash: string): Promise<SessionRow | undefined> {
    throw new Error('Not implemented');
  }
  async revoke(_id: number): Promise<void> {
    throw new Error('Not implemented');
  }
  async revokeAllForUser(_userId: number): Promise<void> {
    throw new Error('Not implemented');
  }
}

module.exports = TokenRepository;
module.exports.default = TokenRepository;
