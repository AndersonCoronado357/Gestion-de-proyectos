// Funciones puras alrededor de JWT y hashing de refresh tokens.
// Aislándolas acá, los use-cases quedan limpios y testeables.

import crypto from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
  TokenPair
} from './auth.types';

// `expiresIn` admite formatos string ('15m', '30d') o número de segundos.
type ExpiresIn = SignOptions['expiresIn'];

interface TokenConfig {
  secret: string;
  accessExpiresIn: ExpiresIn;
  refreshExpiresIn: ExpiresIn;
}

// Convierte '15m', '30d', '1h', '60s' o número a segundos.
export function toSeconds(value: ExpiresIn | undefined): number {
  if (value === undefined) return 0;
  if (typeof value === 'number') return value;
  const m = String(value).match(/^(\d+)([smhd])$/);
  if (!m) return 0;
  const n = parseInt(m[1], 10);
  const mult: Record<string, number> = { s: 1, m: 60, h: 3600, d: 86400 };
  return n * (mult[m[2]] ?? 0);
}

// SHA-256(token) en hex. Lo que vive en sessions.token_hash.
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Genera un ID corto, único, para usar como `jti` del refresh token.
export function newJti(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function signAccessToken(userId: number, config: TokenConfig): string {
  const payload: AccessTokenPayload = { sub: String(userId) };
  return jwt.sign(payload, config.secret, { expiresIn: config.accessExpiresIn });
}

export function signRefreshToken(
  userId: number,
  jti: string,
  config: TokenConfig
): string {
  const payload: RefreshTokenPayload = {
    sub: String(userId),
    type: 'refresh',
    jti
  };
  return jwt.sign(payload, config.secret, { expiresIn: config.refreshExpiresIn });
}

export function verifyAccessToken(
  token: string,
  config: TokenConfig
): AccessTokenPayload {
  const decoded = jwt.verify(token, config.secret);
  if (typeof decoded === 'string' || !decoded || typeof decoded !== 'object') {
    throw new Error('Invalid access token payload');
  }
  if (typeof (decoded as { sub?: unknown }).sub !== 'string') {
    throw new Error('Invalid access token: missing sub');
  }
  return decoded as AccessTokenPayload;
}

export function verifyRefreshToken(
  token: string,
  config: TokenConfig
): RefreshTokenPayload {
  const decoded = jwt.verify(token, config.secret);
  if (typeof decoded === 'string' || !decoded || typeof decoded !== 'object') {
    throw new Error('Invalid refresh token payload');
  }
  const d = decoded as Partial<RefreshTokenPayload>;
  if (d.type !== 'refresh' || typeof d.sub !== 'string' || typeof d.jti !== 'string') {
    throw new Error('Invalid refresh token shape');
  }
  return decoded as RefreshTokenPayload;
}

// Devuelve par access+refresh + sus TTL en segundos.
export function issueTokenPair(userId: number, config: TokenConfig): TokenPair & { jti: string } {
  const jti = newJti();
  const accessToken = signAccessToken(userId, config);
  const refreshToken = signRefreshToken(userId, jti, config);
  return {
    accessToken,
    refreshToken,
    expiresIn: toSeconds(config.accessExpiresIn),
    refreshExpiresIn: toSeconds(config.refreshExpiresIn),
    jti
  };
}
