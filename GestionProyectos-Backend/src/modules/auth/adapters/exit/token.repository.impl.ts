// Implementación Knex (SQL Server) del TokenRepository.

import type { Knex } from 'knex';
import type { SessionRow } from '../../domain/auth.types';
import type {
  SaveSessionInput,
  TokenRepositoryPort
} from '../../ports/token.repository';

const TokenRepository = require('../../ports/token.repository');

class TokenRepositoryImpl extends TokenRepository implements TokenRepositoryPort {
  private db: Knex;
  private table = 'sessions';

  constructor(db: Knex) {
    super();
    this.db = db;
  }

  async save(input: SaveSessionInput): Promise<SessionRow> {
    // SQL Server: `INSERT ... OUTPUT INSERTED.*` para devolver la fila completa.
    const [row] = await this.db<SessionRow>(this.table)
      .insert({
        user_id: input.userId,
        token_hash: input.tokenHash,
        ip_address: input.ipAddress ?? null,
        user_agent: input.userAgent ?? null,
        expires_at: input.expiresAt
      })
      .returning([
        'id',
        'user_id',
        'token_hash',
        'ip_address',
        'user_agent',
        'expires_at',
        'revoked_at',
        'created_at'
      ]);
    return row;
  }

  // Activa = no revocada y no expirada.
  async findActiveByHash(tokenHash: string): Promise<SessionRow | undefined> {
    return this.db<SessionRow>(this.table)
      .where({ token_hash: tokenHash })
      .whereNull('revoked_at')
      .andWhere('expires_at', '>', new Date())
      .first();
  }

  async revoke(id: number): Promise<void> {
    await this.db(this.table).where({ id }).update({ revoked_at: new Date() });
  }

  async revokeAllForUser(userId: number): Promise<void> {
    await this.db(this.table)
      .where({ user_id: userId })
      .whereNull('revoked_at')
      .update({ revoked_at: new Date() });
  }
}

module.exports = TokenRepositoryImpl;
module.exports.default = TokenRepositoryImpl;
