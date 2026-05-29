// Implementación Knex (SQL Server) del UserRepository.

import type { Knex } from 'knex';
import type { UserRow } from '../../domain/auth.types';
import type { UserRepositoryPort, UserWithAccess } from '../../ports/user.repository';

const UserRepository = require('../../ports/user.repository');

class UserRepositoryImpl extends UserRepository implements UserRepositoryPort {
  private db: Knex;
  private table = 'users';

  constructor(db: Knex) {
    super();
    this.db = db;
  }

  // Busca por username, ignorando soft-deletes.
  async findByUsername(username: string): Promise<UserRow | undefined> {
    return this.db<UserRow>(this.table)
      .where({ username })
      .whereNull('deleted_at')
      .first();
  }

  // Busca por email (case-insensitive), ignorando soft-deletes. Usado por
  // el login con Google (el proveedor identifica al usuario por su email).
  async findByEmail(email: string): Promise<UserRow | undefined> {
    return this.db<UserRow>(this.table)
      .whereRaw('LOWER(email) = LOWER(?)', [email])
      .whereNull('deleted_at')
      .first();
  }

  async findById(id: number): Promise<UserRow | undefined> {
    return this.db<UserRow>(this.table)
      .where({ id })
      .whereNull('deleted_at')
      .first();
  }

  // Devuelve el usuario + sus roles + el conjunto plano de permisos (resource:action).
  // Una sola "ida" a la base por tabla — más simple y suficiente para login/me.
  //
  // `isSuper` se computa como un OR sobre el flag is_super de cada rol del
  // usuario; cuando es true el front trata al usuario como con acceso total
  // y ya no necesita inspeccionar permissions[] para los gates de UI.
  async findWithAccessById(id: number): Promise<UserWithAccess | undefined> {
    const user = await this.findById(id);
    if (!user) return undefined;

    const roleRows = await this.db('user_roles as ur')
      .join('roles as r', 'r.id', 'ur.role_id')
      .where('ur.user_id', id)
      .whereNull('r.deleted_at')
      .select<Array<{ name: string; is_super: boolean | number }>>(
        'r.name',
        'r.is_super'
      );

    const roles = roleRows.map((r) => r.name);
    const isSuper = roleRows.some((r) => Boolean(r.is_super));

    // Sacamos los permisos del usuario a través del pivot.  Aliasamos las
    // columnas con `as resource` / `as action` porque, sin aliasar, knex
    // (con el driver de SQL Server) chained con `.distinct()` deformaba
    // el shape del row y mandaba al front strings concatenadas tipo
    // `submodule:1,submodule:1:view,view` en vez de `submodule:1:view`.
    // El gate de acceso buscaba el formato canónico y nada matcheaba →
    // sidebar vacío.  Dedupeamos en JS con un Set.
    const permRows = await this.db('user_roles as ur')
      .join('role_permissions as rp', 'rp.role_id', 'ur.role_id')
      .join('permissions as p', 'p.id', 'rp.permission_id')
      .where('ur.user_id', id)
      .select<Array<{ resource: string; action: string }>>(
        this.db.ref('p.resource').as('resource'),
        this.db.ref('p.action').as('action')
      );

    const seen = new Set<string>();
    const permissions: string[] = [];
    for (const p of permRows) {
      const key = `${p.resource}:${p.action}`;
      if (!seen.has(key)) {
        seen.add(key);
        permissions.push(key);
      }
    }

    return { ...user, roles, permissions, isSuper };
  }

  // Actualización liviana — sólo last_login_at, sin disparar lógica de
  // negocio. El trigger de updated_at corre solo.
  async updateLastLogin(id: number, when: Date): Promise<void> {
    await this.db(this.table).where({ id }).update({ last_login_at: when });
  }

  // Heartbeat — el front lo invoca cada ~60s mientras hay input del
  // usuario.  Se considera "activo" si este timestamp es reciente
  // (consultas que necesiten saber el estado online derivan del valor).
  async updateLastActivity(id: number, when: Date): Promise<void> {
    await this.db(this.table).where({ id }).update({ last_activity_at: when });
  }
}

module.exports = UserRepositoryImpl;
module.exports.default = UserRepositoryImpl;
