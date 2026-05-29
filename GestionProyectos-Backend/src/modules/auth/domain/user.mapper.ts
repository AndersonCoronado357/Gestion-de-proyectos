// Adaptador de fila de DB → forma pública (sin password_hash).

import type { PublicUser, UserRow } from './auth.types';

export function toPublicUser(
  row: UserRow,
  roles: string[],
  permissions: string[],
  isSuper: boolean
): PublicUser {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    status: row.status,
    lastLoginAt: row.last_login_at ? row.last_login_at.toISOString() : null,
    roles,
    permissions,
    isSuper
  };
}
