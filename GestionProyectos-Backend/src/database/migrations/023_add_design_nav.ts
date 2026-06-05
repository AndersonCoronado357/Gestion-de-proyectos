// Agrega el submódulo "Diseñador" en Administración.

import type { Knex } from 'knex';
import crypto from 'node:crypto';

const ICON_DESIGN = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/></svg>`;

const FOLDER_KEY = 'design';
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
    const h = hashOf(ICON_DESIGN);
    let icon = await knex('icons').where({ hash: h }).first('id');
    if (!icon) {
      const [row] = await knex('icons')
        .insert({ svg: ICON_DESIGN, hash: h, name: 'DesignerIcon', display_name: 'Diseñador' })
        .returning('id');
      icon = { id: typeof row === 'number' ? row : (row as { id: number }).id };
    }
    iconCols = { icon_id: (icon as { id: number }).id };
  } else {
    iconCols = { icon: ICON_DESIGN };
  }

  const existing = await knex('submodules').where({ folder_key: FOLDER_KEY }).first('id');
  if (existing) {
    await knex('submodules')
      .where({ id: (existing as { id: number }).id })
      .update({
        module_id: adminId,
        name: 'Diseñador',
        path: '/administracion/diseno',
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
      name: 'Diseñador',
      path: '/administracion/diseno',
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
