// Implementación Knex del UsersRepository.

import type { Knex } from 'knex';
import type { UserStatus } from '../../../auth/domain/auth.types';
import type { UserListItem } from '../../domain/user-list-item';
import type { UsersRepositoryPort } from '../../ports/users.repository';

const UsersRepository = require('../../ports/users.repository');

interface UserListRow {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  status: UserStatus;
  last_login_at: Date | null;
  last_activity_at: Date | null;
  has_active_session: number | boolean;
  roles_csv: string | null;
}

class UsersRepositoryImpl extends UsersRepository implements UsersRepositoryPort {
  private db: Knex;

  constructor(db: Knex) {
    super();
    this.db = db;
  }

  async list(): Promise<UserListItem[]> {
    const result = await this.db.raw(`
      SELECT
        u.id,
        u.username,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.status,
        u.last_login_at,
        u.last_activity_at,
        CASE WHEN EXISTS (
          SELECT 1
          FROM sessions s
          WHERE s.user_id = u.id
            AND s.revoked_at IS NULL
            AND s.expires_at > SYSUTCDATETIME()
        ) THEN 1 ELSE 0 END AS has_active_session,
        (
          SELECT STRING_AGG(r.name, N',')
          FROM user_roles ur
          JOIN roles r ON r.id = ur.role_id
          WHERE ur.user_id = u.id AND r.deleted_at IS NULL
        ) AS roles_csv
      FROM users u
      WHERE u.deleted_at IS NULL
      ORDER BY u.id ASC
    `);

    const rows = (
      Array.isArray(result) ? result : (result?.recordset ?? [])
    ) as UserListRow[];

    return rows.map((r) => ({
      id: r.id,
      username: r.username,
      email: r.email,
      firstName: r.first_name,
      lastName: r.last_name,
      phone: r.phone,
      status: r.status,
      lastLoginAt: r.last_login_at ? new Date(r.last_login_at).toISOString() : null,
      lastActivityAt: r.last_activity_at
        ? new Date(r.last_activity_at).toISOString()
        : null,
      hasActiveSession: !!r.has_active_session,
      roles: r.roles_csv ? r.roles_csv.split(',').filter(Boolean) : []
    }));
  }

  // Reemplazo atómico de roles: borramos los actuales y volvemos a
  // insertar los del payload que existan en la tabla `roles`.  Devuelve
  // los nombres efectivamente persistidos (los desconocidos se ignoran
  // en silencio para no romper si el front manda algo viejo).
  async replaceUserRoles(userId: number, roleNames: string[]): Promise<string[]> {
    return this.db.transaction(async (trx) => {
      // 1) Mapear nombres → ids reales.
      const validRoles =
        roleNames.length === 0
          ? []
          : await trx<{ id: number; name: string }>('roles')
              .whereIn('name', roleNames)
              .whereNull('deleted_at')
              .select('id', 'name');

      // 2) Borrar pivot actual.
      await trx('user_roles').where({ user_id: userId }).del();

      // 3) Insertar los nuevos.
      if (validRoles.length > 0) {
        await trx('user_roles').insert(
          validRoles.map((r) => ({ user_id: userId, role_id: r.id }))
        );
      }

      return validRoles.map((r) => r.name);
    });
  }
}

module.exports = UsersRepositoryImpl;
module.exports.default = UsersRepositoryImpl;
