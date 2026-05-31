// Token de acceso devuelto por login/refresh.
// El refresh token vive en una cookie HttpOnly — el front nunca lo ve.

import type { AuthPreferences, AuthUser } from './user.js';

export interface AccessTokenData {
  accessToken: string;
  // En segundos (TTL del access token).
  expiresIn: number;
}

export interface LoginResponse extends AccessTokenData {
  user: AuthUser;
  preferences: AuthPreferences;
  // Echo del flag que el backend aplicó a la cookie (true = persistente,
  // false = session cookie).  El front lo usa para decidir si cachear
  // en localStorage o sessionStorage.
  remember: boolean;
}

export interface MeResponse {
  user: AuthUser;
  preferences: AuthPreferences;
}

export class Token {
  accessToken: string;
  expiresIn: number;

  constructor({ accessToken, expiresIn }: AccessTokenData) {
    this.accessToken = accessToken;
    this.expiresIn = expiresIn;
  }
}
