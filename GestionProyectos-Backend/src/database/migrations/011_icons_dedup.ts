// Dedup de iconos.
//
// Antes: `modules.icon` y `submodules.icon` guardaban el SVG COMPLETO inline,
// así que el mismo icono se repetía en cada fila que lo usara.
// Ahora: cada SVG vive UNA sola vez en la tabla `icons` (columna `hash`
// UNIQUE = imposible duplicar), y modules/submodules lo referencian por
// `icon_id`. La columna `icon` se conserva pero se vacía (sin duplicación);
// se puede borrar en una migración futura.

import type { Knex } from 'knex';
import crypto from 'node:crypto';

const hashOf = (svg: string): string =>
  crypto.createHash('sha256').update(svg.trim()).digest('hex');

const TABLES = ['modules', 'submodules'] as const;

export async function up(knex: Knex): Promise<void> {
  // 1) Tabla de iconos únicos.
  if (!(await knex.schema.hasTable('icons'))) {
    await knex.schema.createTable('icons', (t) => {
      t.increments('id');
      t.specificType('svg', 'NVARCHAR(MAX)').notNullable();
      t.string('hash', 64).notNullable().unique(); // SHA-256 hex = dedup key
      t.timestamps(true, true);
    });
  }

  // 2) Referencia desde modules / submodules.
  for (const table of TABLES) {
    if (!(await knex.schema.hasColumn(table, 'icon_id'))) {
      await knex.schema.alterTable(table, (t) => {
        t.integer('icon_id').nullable();
      });
    }
  }

  // 3) Migrar los SVG inline existentes → icons (dedup por hash) + icon_id.
  const cache = new Map<string, number>();
  const ensureIcon = async (svg: string): Promise<number> => {
    const h = hashOf(svg);
    const hit = cache.get(h);
    if (hit) return hit;
    const existing = await knex('icons').where({ hash: h }).first('id');
    let id: number;
    if (existing) {
      id = (existing as { id: number }).id;
    } else {
      const [row] = await knex('icons').insert({ svg, hash: h }).returning('id');
      id = typeof row === 'number' ? row : (row as { id: number }).id;
    }
    cache.set(h, id);
    return id;
  };

  for (const table of TABLES) {
    if (!(await knex.schema.hasColumn(table, 'icon'))) continue;
    const rows = (await knex(table)
      .whereNotNull('icon')
      .select('id', 'icon')) as Array<{ id: number; icon: string | null }>;
    for (const r of rows) {
      const svg = (r.icon ?? '').trim();
      if (!svg) continue;
      const iconId = await ensureIcon(svg);
      await knex(table).where({ id: r.id }).update({ icon_id: iconId });
    }
    // 4) Vaciar la columna vieja: elimina la duplicación.
    await knex(table).whereNotNull('icon').update({ icon: null });
  }
}

export async function down(knex: Knex): Promise<void> {
  // Restaurar el SVG inline desde `icons` y revertir el esquema.
  for (const table of TABLES) {
    const hasIcon = await knex.schema.hasColumn(table, 'icon');
    const hasIconId = await knex.schema.hasColumn(table, 'icon_id');
    if (hasIcon && hasIconId) {
      const rows = (await knex(table)
        .whereNotNull(`${table}.icon_id`)
        .join('icons', `${table}.icon_id`, 'icons.id')
        .select(`${table}.id as id`, 'icons.svg as svg')) as Array<{
        id: number;
        svg: string;
      }>;
      for (const r of rows) {
        await knex(table).where({ id: r.id }).update({ icon: r.svg });
      }
    }
    if (hasIconId) {
      await knex.schema.alterTable(table, (t) => t.dropColumn('icon_id'));
    }
  }
  await knex.schema.dropTableIfExists('icons');
}
