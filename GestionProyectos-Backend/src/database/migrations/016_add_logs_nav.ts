// Agrega el submódulo "Logs" dentro del módulo "Administración".
//
// Idempotente (por folder_key 'logs'). Respeta el dedup de iconos
// (migración 011): si existe `submodules.icon_id`, el SVG va a la tabla
// `icons` y se referencia; si no, se guarda inline en `icon`.

import type { Knex } from 'knex';
import crypto from 'node:crypto';

const ICON_LOGS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/><line x1="8" y1="9" x2="10" y2="9"/></svg>`;

const FOLDER_KEY = 'logs';
const hashOf = (svg: string): string =>
  crypto.createHash('sha256').update(svg.trim()).digest('hex');

export async function up(knex: Knex): Promise<void> {
  const admin = await knex('modules')
    .where({ name: 'Administración' })
    .whereNull('deleted_at')
    .first('id');
  if (!admin) return;
  const adminId = (admin as { id: number }).id;

  let iconCols: Record<string, unknown>;
  if (await knex.schema.hasColumn('submodules', 'icon_id')) {
    const h = hashOf(ICON_LOGS);
    let icon = await knex('icons').where({ hash: h }).first('id');
    if (!icon) {
      const [row] = await knex('icons')
        .insert({ svg: ICON_LOGS, hash: h })
        .returning('id');
      icon = { id: typeof row === 'number' ? row : (row as { id: number }).id };
    }
    iconCols = { icon_id: (icon as { id: number }).id };
  } else {
    iconCols = { icon: ICON_LOGS };
  }

  const existing = await knex('submodules')
    .where({ folder_key: FOLDER_KEY })
    .first('id');

  if (existing) {
    await knex('submodules')
      .where({ id: (existing as { id: number }).id })
      .update({
        module_id: adminId,
        name: 'Logs',
        path: '/administracion/logs',
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
      name: 'Logs',
      path: '/administracion/logs',
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
