// Implementación Knex del RolesRepository.
//
// Cómo modelamos el shape del front (`PermissionMap`) sobre las tablas
// existentes:
//
//   permissions.resource = 'submodule:<id>'
//   permissions.action   = 'view' | 'create' | 'edit' | 'delete'
//
// Cuando el front guarda `{ '5': { view: true, edit: true } }`, esto se
// traduce a 2 filas en `permissions`:
//   ('submodule:5', 'view')
//   ('submodule:5', 'edit')
// (las inserta si no existían) y luego rellena `role_permissions` con
// las que corresponden.  Para reemplazar atómicamente las del rol:
// borramos las viejas, insertamos las nuevas.
//
// Para cargos usamos el pivot `role_services` (role_id ↔ service_id).
// El front trabaja con `service.code`; resolvemos a id mirando la tabla.

import type { Knex } from 'knex';
import type {
  PermissionAction,
  RoleCreateInput,
  RoleItem,
  RolePermissionMap,
  RoleUpdateInput
} from '../../domain/role.types';
import { PERMISSION_ACTIONS } from '../../domain/role.types';
import type { RolesRepositoryPort } from '../../ports/roles.repository';

const RolesRepository = require('../../ports/roles.repository');
const AppError = require('../../../../shared/errors/app.error');

interface RoleRow {
  id: number;
  name: string;
  description: string | null;
  is_super: boolean | number;
  created_at: Date;
  updated_at: Date;
}

const SUBMODULE_RESOURCE_PREFIX = 'submodule:';
const ROLE_COLUMNS = [
  'id',
  'name',
  'description',
  'is_super',
  'created_at',
  'updated_at'
] as const;

function isPermissionAction(s: string): s is PermissionAction {
  return (PERMISSION_ACTIONS as readonly string[]).includes(s);
}

function toRoleItem(
  row: RoleRow,
  permissions: RolePermissionMap,
  cargos: string[]
): RoleItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    permissions,
    cargos,
    isSuper: Boolean(row.is_super),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString()
  };
}

class RolesRepositoryImpl extends RolesRepository implements RolesRepositoryPort {
  private db: Knex;

  constructor(db: Knex) {
    super();
    this.db = db;
  }

  async list(): Promise<RoleItem[]> {
    const rows = await this.db<RoleRow>('roles')
      .whereNull('deleted_at')
      .orderBy('name', 'asc')
      .select(...ROLE_COLUMNS);

    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.id);
    const permsByRole = await this.fetchPermissionsForRoles(ids);
    const cargosByRole = await this.fetchCargosForRoles(ids);

    return rows.map((r) =>
      toRoleItem(r, permsByRole.get(r.id) ?? {}, cargosByRole.get(r.id) ?? [])
    );
  }

  async findById(id: number): Promise<RoleItem | null> {
    const row = await this.db<RoleRow>('roles')
      .where({ id })
      .whereNull('deleted_at')
      .first(...ROLE_COLUMNS);
    if (!row) return null;
    const [permsByRole, cargosByRole] = await Promise.all([
      this.fetchPermissionsForRoles([id]),
      this.fetchCargosForRoles([id])
    ]);
    return toRoleItem(row, permsByRole.get(id) ?? {}, cargosByRole.get(id) ?? []);
  }

  async create(input: RoleCreateInput): Promise<RoleItem> {
    return this.db.transaction(async (trx) => {
      const [inserted] = await trx<RoleRow>('roles')
        .insert({
          name: input.name,
          description: input.description ?? null
        })
        .returning(['id']);
      const id = inserted.id;
      await this.replacePermissionsTx(trx, id, input.permissions ?? {});
      await this.replaceCargosTx(trx, id, input.cargos ?? []);
      return this.findByIdTx(trx, id);
    });
  }

  async update(id: number, input: RoleUpdateInput): Promise<RoleItem> {
    return this.db.transaction(async (trx) => {
      const existing = await trx<RoleRow>('roles')
        .where({ id })
        .whereNull('deleted_at')
        .first(...ROLE_COLUMNS);
      if (!existing) throw AppError.notFound('Rol no encontrado');

      const patch: Partial<RoleRow> & { updated_at?: Date } = {
        updated_at: new Date()
      };
      if (typeof input.name === 'string') patch.name = input.name;
      if (input.description !== undefined) patch.description = input.description;

      if (Object.keys(patch).length > 1) {
        await trx('roles').where({ id }).update(patch);
      }

      // Para roles super ignoramos los pivots — su acceso es implícito.
      // No los borramos ni los actualizamos para evitar perder estado de
      // un eventual cambio de is_super → no-super en el futuro.
      const isSuper = Boolean(existing.is_super);
      if (!isSuper) {
        if (input.permissions !== undefined) {
          await this.replacePermissionsTx(trx, id, input.permissions);
        }
        if (input.cargos !== undefined) {
          await this.replaceCargosTx(trx, id, input.cargos);
        }
      }

      return this.findByIdTx(trx, id);
    });
  }

  async softDelete(id: number): Promise<void> {
    // Bloqueo defensivo: borrar un rol super dejaría a los usuarios que
    // sólo lo tenían sin ningún acceso (y posiblemente sin forma de
    // recuperar el sistema).  El frontend ya esconde el botón, pero
    // mantenemos el guard server-side por si alguien arma el request a mano.
    const existing = await this.db<RoleRow>('roles')
      .where({ id })
      .whereNull('deleted_at')
      .first(...ROLE_COLUMNS);
    if (!existing) throw AppError.notFound('Rol no encontrado');
    if (Boolean(existing.is_super)) {
      throw AppError.forbidden('No se puede eliminar un rol del sistema');
    }

    await this.db('roles').where({ id }).update({ deleted_at: new Date() });
    // Limpiamos los pivots — un rol borrado no debería seguir asignado.
    await this.db('role_permissions').where({ role_id: id }).del();
    await this.db('role_services').where({ role_id: id }).del();
    await this.db('user_roles').where({ role_id: id }).del();
  }

  // ── helpers ────────────────────────────────────────────────────────

  private async findByIdTx(trx: Knex.Transaction, id: number): Promise<RoleItem> {
    const row = await trx<RoleRow>('roles').where({ id }).first(...ROLE_COLUMNS);
    if (!row) throw AppError.notFound('Rol no encontrado tras guardar');
    const [permsByRole, cargosByRole] = await Promise.all([
      this.fetchPermissionsForRolesTx(trx, [id]),
      this.fetchCargosForRolesTx(trx, [id])
    ]);
    return toRoleItem(row, permsByRole.get(id) ?? {}, cargosByRole.get(id) ?? []);
  }

  private async fetchPermissionsForRoles(
    roleIds: number[]
  ): Promise<Map<number, RolePermissionMap>> {
    return this.fetchPermissionsForRolesTx(this.db, roleIds);
  }

  private async fetchPermissionsForRolesTx(
    qb: Knex | Knex.Transaction,
    roleIds: number[]
  ): Promise<Map<number, RolePermissionMap>> {
    if (roleIds.length === 0) return new Map();
    const rows = await qb('role_permissions as rp')
      .join('permissions as p', 'p.id', 'rp.permission_id')
      .whereIn('rp.role_id', roleIds)
      .where('p.resource', 'like', `${SUBMODULE_RESOURCE_PREFIX}%`)
      .select<Array<{ role_id: number; resource: string; action: string }>>(
        'rp.role_id',
        'p.resource',
        'p.action'
      );

    const result = new Map<number, RolePermissionMap>();
    for (const row of rows) {
      const submoduleId = row.resource.slice(SUBMODULE_RESOURCE_PREFIX.length);
      if (!isPermissionAction(row.action)) continue;
      const map = result.get(row.role_id) ?? {};
      const perms = map[submoduleId] ?? {};
      perms[row.action] = true;
      map[submoduleId] = perms;
      result.set(row.role_id, map);
    }
    return result;
  }

  private async fetchCargosForRoles(
    roleIds: number[]
  ): Promise<Map<number, string[]>> {
    return this.fetchCargosForRolesTx(this.db, roleIds);
  }

  private async fetchCargosForRolesTx(
    qb: Knex | Knex.Transaction,
    roleIds: number[]
  ): Promise<Map<number, string[]>> {
    if (roleIds.length === 0) return new Map();
    const rows = await qb('role_services as rs')
      .join('services as s', 's.id', 'rs.service_id')
      .whereIn('rs.role_id', roleIds)
      .whereNull('s.deleted_at')
      .select<Array<{ role_id: number; code: string }>>('rs.role_id', 's.code');
    const result = new Map<number, string[]>();
    for (const row of rows) {
      const list = result.get(row.role_id) ?? [];
      list.push(row.code);
      result.set(row.role_id, list);
    }
    return result;
  }

  // Reemplazo atómico de permisos:
  //   1) borrar todo `role_permissions` del rol.
  //   2) asegurar que cada `(resource, action)` exista en `permissions`
  //      (insert si no), recuperar sus ids.
  //   3) re-insertar `role_permissions`.
  private async replacePermissionsTx(
    trx: Knex.Transaction,
    roleId: number,
    permissions: RolePermissionMap
  ): Promise<void> {
    // Lista plana de pares (resource, action) a aplicar.
    const pairs: Array<{ resource: string; action: PermissionAction }> = [];
    for (const [submoduleId, actions] of Object.entries(permissions)) {
      if (!actions) continue;
      for (const action of PERMISSION_ACTIONS) {
        if (actions[action]) {
          pairs.push({
            resource: `${SUBMODULE_RESOURCE_PREFIX}${submoduleId}`,
            action
          });
        }
      }
    }

    // Borrar las asignaciones actuales.
    await trx('role_permissions').where({ role_id: roleId }).del();
    if (pairs.length === 0) return;

    // Asegurar filas en `permissions`.  Insertamos sólo las que faltan.
    const existing = await trx('permissions')
      .where((qb) => {
        for (const p of pairs) qb.orWhere({ resource: p.resource, action: p.action });
      })
      .select<Array<{ id: number; resource: string; action: string }>>(
        'id',
        'resource',
        'action'
      );
    const key = (r: string, a: string) => `${r}::${a}`;
    const haveKey = new Set(existing.map((r) => key(r.resource, r.action)));
    const missing = pairs.filter((p) => !haveKey.has(key(p.resource, p.action)));
    if (missing.length > 0) {
      await trx('permissions').insert(
        missing.map((p) => ({ resource: p.resource, action: p.action }))
      );
    }

    // Releer ids de TODAS las que aplican.
    const all = await trx('permissions')
      .where((qb) => {
        for (const p of pairs) qb.orWhere({ resource: p.resource, action: p.action });
      })
      .select<Array<{ id: number; resource: string; action: string }>>(
        'id',
        'resource',
        'action'
      );
    const idMap = new Map(all.map((r) => [key(r.resource, r.action), r.id]));

    // Insertar role_permissions (con UNIQUE compuesto idempotente).
    const inserts = pairs
      .map((p) => idMap.get(key(p.resource, p.action)))
      .filter((id): id is number => typeof id === 'number')
      .map((permission_id) => ({ role_id: roleId, permission_id }));
    if (inserts.length > 0) {
      await trx('role_permissions').insert(inserts);
    }
  }

  // Reemplazo atómico de cargos (codes): map codes → service_ids,
  // borrar role_services del rol, insertar los nuevos.
  private async replaceCargosTx(
    trx: Knex.Transaction,
    roleId: number,
    cargoCodes: string[]
  ): Promise<void> {
    await trx('role_services').where({ role_id: roleId }).del();
    if (cargoCodes.length === 0) return;
    const services = await trx<{ id: number; code: string }>('services')
      .whereIn('code', cargoCodes)
      .whereNull('deleted_at')
      .select('id', 'code');
    if (services.length === 0) return;
    await trx('role_services').insert(
      services.map((s) => ({ role_id: roleId, service_id: s.id }))
    );
  }
}

module.exports = RolesRepositoryImpl;
module.exports.default = RolesRepositoryImpl;
