// Implementación Knex + AES-256-GCM del repositorio de tokens.
//
// El refresh token se cifra antes de tocar la BD usando la misma master
// key (APP_ENCRYPTION_KEY) que usa el resto de credenciales de la app.
// Si la BD se filtra, los refresh tokens NO sirven sin la master key.

import type { Knex } from 'knex';
import { decrypt, encrypt } from '../../../../../shared/crypto/encryption';
import type {
  GoogleAccountConnection,
  PersistTokenInput
} from '../../domain/google-token.types';
import type { GoogleTokenRepository } from '../../ports/google-token.repository';

const env = require('../../../../../config/env');

interface Row {
  id: number;
  user_id: number;
  refresh_token_encrypted: string;
  scopes: string;
  google_email: string | null;
  last_used_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function toDomain(row: Row): GoogleAccountConnection {
  return {
    userId: row.user_id,
    googleEmail: row.google_email,
    scopes: row.scopes.split(' ').filter(Boolean),
    lastUsedAt: row.last_used_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function buildGoogleTokenRepository(
  db: Knex
): GoogleTokenRepository {
  const masterKey: string = String(env.appEncryptionKey ?? '');

  return {
    async upsert(input: PersistTokenInput): Promise<GoogleAccountConnection> {
      const encrypted = encrypt(input.refreshToken, masterKey);
      const now = new Date();
      const scopesStr = input.scopes.join(' ');

      const existing = await db<Row>('user_google_tokens')
        .where({ user_id: input.userId })
        .first();

      if (existing) {
        await db<Row>('user_google_tokens')
          .where({ user_id: input.userId })
          .update({
            refresh_token_encrypted: encrypted,
            scopes: scopesStr,
            google_email: input.googleEmail,
            updated_at: now
          });
      } else {
        await db<Row>('user_google_tokens').insert({
          user_id: input.userId,
          refresh_token_encrypted: encrypted,
          scopes: scopesStr,
          google_email: input.googleEmail,
          created_at: now,
          updated_at: now
        });
      }

      const row = await db<Row>('user_google_tokens')
        .where({ user_id: input.userId })
        .first();
      if (!row) throw new Error('upsert: no row after insert/update');
      return toDomain(row);
    },

    async findByUserId(
      userId: number
    ): Promise<GoogleAccountConnection | null> {
      const row = await db<Row>('user_google_tokens')
        .where({ user_id: userId })
        .first();
      return row ? toDomain(row) : null;
    },

    async findRefreshTokenByUserId(userId: number): Promise<string | null> {
      const row = await db<Row>('user_google_tokens')
        .where({ user_id: userId })
        .first();
      if (!row) return null;
      return decrypt(row.refresh_token_encrypted, masterKey);
    },

    async deleteByUserId(userId: number): Promise<void> {
      await db<Row>('user_google_tokens').where({ user_id: userId }).delete();
    },

    async touchLastUsedAt(userId: number): Promise<void> {
      await db<Row>('user_google_tokens')
        .where({ user_id: userId })
        .update({ last_used_at: new Date() });
    }
  };
}
