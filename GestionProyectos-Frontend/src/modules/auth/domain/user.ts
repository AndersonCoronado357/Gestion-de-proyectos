// Forma del usuario autenticado tal como lo expone el backend.
// Coincide con `PublicUser` en backend/auth/domain/auth.types.ts.

export type UserStatus = 0 | 1 | 2 | 3;

export interface AuthUser {
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
  // Bypass de acceso: true → ve TODOS los módulos sin chequear permissions[].
  isSuper: boolean;
}

// Forma del bloque "preferences" que viaja en /auth/login y /auth/me.
// (Igual que UiPreferences del backend.)
export interface AuthPreferences {
  mode: 'light' | 'dark';
  accentHex: string;
  fontFamily: string;
  fontSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}
