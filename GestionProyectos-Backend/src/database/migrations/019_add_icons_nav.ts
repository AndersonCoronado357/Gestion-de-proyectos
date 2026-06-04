// Agrega el submódulo "Iconos" en Administración (gestión del catálogo SVG).

import type { Knex } from 'knex';
import crypto from 'node:crypto';

const ICON_GALLERY = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`;

const FOLDER_KEY = 'icons';
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
    const h = hashOf(ICON_GALLERY);
    let icon = await knex('icons').where({ hash: h }).first('id');
    if (!icon) {
      const [row] = await knex('icons')
        .insert({ svg: ICON_GALLERY, hash: h, name: 'IconGalleryIcon' })
        .returning('id');
      icon = { id: typeof row === 'number' ? row : (row as { id: number }).id };
    }
    iconCols = { icon_id: (icon as { id: number }).id };
  } else {
    iconCols = { icon: ICON_GALLERY };
  }

  const existing = await knex('submodules')
    .where({ folder_key: FOLDER_KEY })
    .first('id');

  if (existing) {
    await knex('submodules')
      .where({ id: (existing as { id: number }).id })
      .update({
        module_id: adminId,
        name: 'Iconos',
        path: '/administracion/iconos',
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
      name: 'Iconos',
      path: '/administracion/iconos',
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
