// Implementación Knex (SQL Server) del NavigationRepository.

import type { Knex } from 'knex';
import crypto from 'node:crypto';
import type {
  IdMap,
  ModuleNode,
  NavigationTree,
  NavigationTreeInput,
  SaveTreeResult,
  SubmoduleNode
} from '../../domain/navigation.types';
import type { NavigationRepositoryPort } from '../../ports/navigation.repository';

const NavigationRepository = require('../../ports/navigation.repository');

interface ModuleRow {
  id: number;
  name: string;
  icon: string | null;
  icon_id?: number | null;
  display_order: number;
}

interface SubmoduleRow {
  id: number;
  module_id: number;
  name: string;
  icon: string | null;
  icon_id?: number | null;
  path: string | null;
  folder_key: string | null;
  display_order: number;
}

// ── Dedup de iconos (SVG) ─────────────────────────────────────────────
// Los SVG no se guardan inline en cada fila (se repetían): viven una sola
// vez en la tabla `icons` (hash UNIQUE) y modules/submodules referencian
// `icon_id`. Resiliente: si la migración `011_icons_dedup` aún no corrió
// (no existe la columna `icon_id`), cae a la columna `icon` vieja, así la
// navegación nunca se rompe.

const hashOf = (svg: string): string =>
  crypto.createHash('sha256').update(svg.trim()).digest('hex');

// Una vez detectada la columna `icon_id` queda cacheada (la migración sólo
// agrega, nunca quita en uso normal). Pre-migración se re-chequea cada vez.
let iconsEnabledCache = false;
async function iconsEnabled(qb: Knex | Knex.Transaction): Promise<boolean> {
  if (iconsEnabledCache) return true;
  const has = await qb.schema.hasColumn('modules', 'icon_id');
  if (has) iconsEnabledCache = true;
  return has;
}

// find-or-create del icono por hash. Devuelve el id, o null si no hay SVG.
async function findOrCreateIcon(
  trx: Knex.Transaction,
  svg: string | null | undefined
): Promise<number | null> {
  const s = (svg ?? '').trim();
  if (!s) return null;
  const h = hashOf(s);
  const existing = await trx('icons').where({ hash: h }).first('id');
  if (existing) return (existing as { id: number }).id;
  try {
    const [row] = await trx('icons').insert({ svg: s, hash: h }).returning('id');
    return typeof row === 'number' ? row : (row as { id: number }).id;
  } catch {
    // Carrera con otro insert del mismo hash → re-buscar.
    const again = await trx('icons').where({ hash: h }).first('id');
    return again ? (again as { id: number }).id : null;
  }
}

class NavigationRepositoryImpl
  extends NavigationRepository
  implements NavigationRepositoryPort
{
  private db: Knex;

  constructor(db: Knex) {
    super();
    this.db = db;
  }

  async getTree(): Promise<NavigationTree> {
    return this.fetchTree(this.db);
  }

  // El payload entra como "verdad". Para cada módulo y submódulo:
  //   - si el id ya existe → UPDATE (re-asignar display_order según el array).
  //   - si no tiene id     → INSERT.
  //   - los ids actuales que no aparecen en el payload → soft-delete.
  //
  // Todo en una transacción para que el frontend nunca vea un estado
  // intermedio.
  async saveTree(input: NavigationTreeInput): Promise<SaveTreeResult> {
    return this.db.transaction(async (trx) => {
      const now = new Date();
      const enabled = await iconsEnabled(trx);
      // Columnas de icono a escribir según el esquema: `icon_id` (dedup) si
      // la migración corrió, o `icon` inline (legado) si no.
      const iconCols = async (
        svg: string | null | undefined
      ): Promise<Record<string, unknown>> =>
        enabled
          ? { icon_id: await findOrCreateIcon(trx, svg) }
          : { icon: svg ?? null };

      const existingModules = await trx<ModuleRow>('modules')
        .whereNull('deleted_at')
        .select('id');
      const existingModuleIds = new Set(existingModules.map((m) => m.id));
      const payloadModuleIds = new Set(
        input.map((m) => m.id).filter((id): id is number => typeof id === 'number')
      );

      // Por cada módulo del payload, guardamos el serverId real (existente
      // o recién insertado).  Lo usamos como módulo padre al insertar sus
      // submódulos. Indexado por posición en el array de input.
      const moduleIdByIndex: number[] = new Array(input.length);
      const idMap: IdMap = { modules: {}, submodules: {} };

      // 1) Upsert módulos.
      for (let i = 0; i < input.length; i++) {
        const m = input[i];
        const displayOrder = i + 1;

        if (typeof m.id === 'number' && existingModuleIds.has(m.id)) {
          await trx('modules')
            .where({ id: m.id })
            .update({
              name: m.name,
              ...(await iconCols(m.icon)),
              display_order: displayOrder,
              deleted_at: null
            });
          moduleIdByIndex[i] = m.id;
        } else {
          const [inserted] = await trx('modules')
            .insert({
              name: m.name,
              ...(await iconCols(m.icon)),
              display_order: displayOrder
            })
            .returning(['id']);
          const newId =
            typeof inserted === 'number' ? inserted : (inserted as { id: number }).id;
          moduleIdByIndex[i] = newId;
          if (m.clientId) idMap.modules[m.clientId] = newId;
        }
      }

      // 2) Soft-delete módulos que el payload omitió.
      const toDeleteModules = [...existingModuleIds].filter(
        (id) => !payloadModuleIds.has(id)
      );
      if (toDeleteModules.length > 0) {
        await trx('modules')
          .whereIn('id', toDeleteModules)
          .update({ deleted_at: now });

        // En cascada blanda: también ocultamos sus submódulos.
        await trx('submodules')
          .whereIn('module_id', toDeleteModules)
          .whereNull('deleted_at')
          .update({ deleted_at: now });
      }

      // 3) Upsert submódulos por cada módulo.
      const existingSubs = await trx('submodules')
        .whereNull('deleted_at')
        .select<Array<Pick<SubmoduleRow, 'id' | 'module_id'>>>('id', 'module_id');
      const existingSubsById = new Map<number, Pick<SubmoduleRow, 'id' | 'module_id'>>();
      existingSubs.forEach((s) => existingSubsById.set(s.id, s));
      const payloadSubIds = new Set<number>();

      for (let i = 0; i < input.length; i++) {
        const m = input[i];
        const realModuleId = moduleIdByIndex[i];

        for (let j = 0; j < m.submodules.length; j++) {
          const s = m.submodules[j];
          const subOrder = j + 1;

          if (typeof s.id === 'number' && existingSubsById.has(s.id)) {
            await trx('submodules')
              .where({ id: s.id })
              .update({
                module_id: realModuleId,
                name: s.name,
                ...(await iconCols(s.icon)),
                path: s.path ?? null,
                folder_key: s.folderKey ?? null,
                display_order: subOrder,
                deleted_at: null
              });
            payloadSubIds.add(s.id);
          } else {
            const [inserted] = await trx('submodules')
              .insert({
                module_id: realModuleId,
                name: s.name,
                ...(await iconCols(s.icon)),
                path: s.path ?? null,
                folder_key: s.folderKey ?? null,
                display_order: subOrder
              })
              .returning(['id']);
            const newId =
              typeof inserted === 'number' ? inserted : (inserted as { id: number }).id;
            payloadSubIds.add(newId);
            if (s.clientId) idMap.submodules[s.clientId] = newId;
          }
        }
      }

      // 4) Soft-delete submódulos que el payload omitió (y que pertenecen
      //    a módulos que siguen vivos).
      const toDeleteSubs = [...existingSubsById.keys()].filter(
        (id) => !payloadSubIds.has(id)
      );
      if (toDeleteSubs.length > 0) {
        await trx('submodules')
          .whereIn('id', toDeleteSubs)
          .whereNull('deleted_at')
          .update({ deleted_at: now });
      }

      const tree = await this.fetchTree(trx);
      return { tree, idMap };
    });
  }

  // ── helpers ────────────────────────────────────────────────────────
  private async fetchTree(qb: Knex | Knex.Transaction): Promise<NavigationTree> {
    const enabled = await iconsEnabled(qb);

    // Con dedup: el SVG se trae con un LEFT JOIN a `icons` (alias `icon`),
    // así el shape de salida no cambia. Sin dedup: la columna `icon` vieja.
    const modules = enabled
      ? await qb<ModuleRow>('modules')
          .whereNull('modules.deleted_at')
          .leftJoin('icons', 'modules.icon_id', 'icons.id')
          .orderBy([
            { column: 'modules.display_order', order: 'asc' },
            { column: 'modules.id', order: 'asc' }
          ])
          .select(
            'modules.id as id',
            'modules.name as name',
            'icons.svg as icon',
            'modules.display_order as display_order'
          )
      : await qb<ModuleRow>('modules')
          .whereNull('deleted_at')
          .orderBy([
            { column: 'display_order', order: 'asc' },
            { column: 'id', order: 'asc' }
          ])
          .select('id', 'name', 'icon', 'display_order');

    if (modules.length === 0) return [];

    const moduleIds = modules.map((m) => m.id);
    const submodules = enabled
      ? await qb<SubmoduleRow>('submodules')
          .whereIn('submodules.module_id', moduleIds)
          .whereNull('submodules.deleted_at')
          .leftJoin('icons', 'submodules.icon_id', 'icons.id')
          .orderBy([
            { column: 'submodules.module_id', order: 'asc' },
            { column: 'submodules.display_order', order: 'asc' },
            { column: 'submodules.id', order: 'asc' }
          ])
          .select(
            'submodules.id as id',
            'submodules.module_id as module_id',
            'submodules.name as name',
            'icons.svg as icon',
            'submodules.path as path',
            'submodules.folder_key as folder_key',
            'submodules.display_order as display_order'
          )
      : await qb<SubmoduleRow>('submodules')
          .whereIn('module_id', moduleIds)
          .whereNull('deleted_at')
          .orderBy([
            { column: 'module_id', order: 'asc' },
            { column: 'display_order', order: 'asc' },
            { column: 'id', order: 'asc' }
          ])
          .select(
            'id',
            'module_id',
            'name',
            'icon',
            'path',
            'folder_key',
            'display_order'
          );

    const subsByModule = new Map<number, SubmoduleNode[]>();
    submodules.forEach((s) => {
      const list = subsByModule.get(s.module_id) ?? [];
      list.push({
        id: s.id,
        name: s.name,
        icon: s.icon,
        path: s.path,
        folderKey: s.folder_key,
        displayOrder: s.display_order
      });
      subsByModule.set(s.module_id, list);
    });

    return modules.map<ModuleNode>((m) => ({
      id: m.id,
      name: m.name,
      icon: m.icon,
      displayOrder: m.display_order,
      submodules: subsByModule.get(m.id) ?? []
    }));
  }
}

module.exports = NavigationRepositoryImpl;
module.exports.default = NavigationRepositoryImpl;
