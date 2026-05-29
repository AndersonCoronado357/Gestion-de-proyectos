// Tipos compartidos del módulo de autenticación.
//
// Mantenerlos centralizados evita que cada use-case redefina el mismo shape
// con leves diferencias.

export const USER_STATUS = {
  PENDING: 0,
  ACTIVE: 1,
  INACTIVE: 2,
  SUSPENDED: 3
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

// Fila tal como vive en la tabla `users`.
export interface UserRow {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  status: UserStatus;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

// Forma "pública" del usuario — sin password_hash ni timestamps internos —
// lista para mandarle al front.
export interface PublicUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: UserStatus;
  lastLoginAt: string | null;
  roles: string[];
  permissions: string[];
  // True si alguno de sus roles tiene is_super=1 — el front lo usa como
  // bypass para mostrar TODOS los módulos sin necesitar permissions[].
  isSuper: boolean;
}

export interface SessionRow {
  id: number;
  user_id: number;
  token_hash: string;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

export interface AccessTokenPayload {
  sub: string;
  // jti = JWT ID. Lo usamos como bisagra para enlazar el access con la sesión.
  jti?: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sub: string;
  type: 'refresh';
  // jti único — lo hasheamos con SHA-256 y eso es lo que guardamos en sessions.token_hash.
  jti: string;
  iat?: number;
  exp?: number;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  // Tiempo de vida del access token (segundos).
  expiresIn: number;
  // Tiempo de vida del refresh token (segundos) — útil para setear la cookie.
  refreshExpiresIn: number;
}
