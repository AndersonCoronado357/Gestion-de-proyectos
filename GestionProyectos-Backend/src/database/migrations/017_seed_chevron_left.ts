// Siembra el ChevronLeftIcon en la tabla `icons`.
//
// La librería ya tiene ChevronRightIcon y ChevronDownIcon (sembrados por
// migración 013), pero faltaba la flecha izquierda — necesaria para botones
// de "Anterior", navegación lateral, etc. Estilo coherente con los demás
// chevrons (viewBox 24×24, stroke=currentColor, sin width/height fijos).

import type { Knex } from 'knex';
import crypto from 'node:crypto';

const CHEVRON_LEFT_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`;

const hashOf = (svg: string): string =>
  crypto.createHash('sha256').update(svg.trim()).digest('hex');

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('icons'))) return;
  const h = hashOf(CHEVRON_LEFT_SVG);
  const existing = await knex('icons').where({ hash: h }).first('id');
  if (existing) {
    await knex('icons')
      .where({ id: (existing as { id: number }).id })
      .update({ name: 'ChevronLeftIcon' });
  } else {
    await knex('icons').insert({
      svg: CHEVRON_LEFT_SVG,
      hash: h,
      name: 'ChevronLeftIcon'
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('icons'))) return;
  await knex('icons').where({ name: 'ChevronLeftIcon' }).del();
}
