// Agrega el submódulo "Tests" dentro del módulo "Administración".
//
// Idempotente (por folder_key 'test-runner'). Respeta el dedup de iconos
// (migración 011): si existe `submodules.icon_id`, el SVG va a la tabla
// `icons` y se referencia; si no, se guarda inline en `icon`.

import type { Knex } from 'knex';
import crypto from 'node:crypto';

const ICON_LAB = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2v6L4 18a2 2 0 0 0 1.73 3h12.54A2 2 0 0 0 20 18L15 8V2"/><path d="M7 2h10"/><path d="M6.5 13h11"/></svg>`;

const FOLDER_KEY = 'test-runner';
const hashOf = (svg: string): string =>
  crypto.createHash('sha256').update(svg.trim()).digest('hex');

export async function up(knex: Knex): Promise<void> {
  const admin = await knex('modules')
    .where({ name: 'Administración' })
    .whereNull('deleted_at')
    .first('id');
  if (!admin) return; // sin módulo Administración (lo crea el seed 002)
  const adminId = (admin as { id: number }).id;

  // Columnas del icono según el esquema (dedup vs inline).
  let iconCols: Record<string, unknown>;
  if (await knex.schema.hasColumn('submodules', 'icon_id')) {
    const h = hashOf(ICON_LAB);
    let icon = await knex('icons').where({ hash: h }).first('id');
    if (!icon) {
      const [row] = await knex('icons')
        .insert({ svg: ICON_LAB, hash: h })
        .returning('id');
      icon = { id: typeof row === 'number' ? row : (row as { id: number }).id };
    }
    iconCols = { icon_id: (icon as { id: number }).id };
  } else {
    iconCols = { icon: ICON_LAB };
  }

  const existing = await knex('submodules')
    .where({ folder_key: FOLDER_KEY })
    .first('id');

  if (existing) {
    await knex('submodules')
      .where({ id: (existing as { id: number }).id })
      .update({
        module_id: adminId,
        name: 'Tests',
        path: '/administracion/tests',
        ...iconCols,
        deleted_at: null
      });
  } else {
    const maxOrder = await knex('submodules')
      .where({ module_id: adminId })
      .whereNull('deleted_at')
      .max('display_order as m')
      .first();
    const order = (((maxOrder as { m: number | null })?.m ?? 0) || 0) + 1;
    await knex('submodules').insert({
      module_id: adminId,
      name: 'Tests',
      path: '/administracion/tests',
      folder_key: FOLDER_KEY,
      display_order: order,
      ...iconCols
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  await knex('submodules')
    .where({ folder_key: FOLDER_KEY })
    .update({ deleted_at: knex.fn.now() });
}
