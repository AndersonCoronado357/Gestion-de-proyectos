// Siembra el CheckCircleIcon en la tabla `icons`.
//
// Estilo Heroicons outline: un círculo con check adentro, en un único path.
// Lo usa el Stepper para marcar pasos completados, y queda disponible para
// cualquier otra vista (mensajes de éxito, listas de validación, etc.).

import type { Knex } from 'knex';
import crypto from 'node:crypto';

const CHECK_CIRCLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>`;

const hashOf = (svg: string): string =>
  crypto.createHash('sha256').update(svg.trim()).digest('hex');

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('icons'))) return;
  const h = hashOf(CHECK_CIRCLE_SVG);
  const existing = await knex('icons').where({ hash: h }).first('id');
  if (existing) {
    await knex('icons')
      .where({ id: (existing as { id: number }).id })
      .update({ name: 'CheckCircleIcon' });
  } else {
    await knex('icons').insert({
      svg: CHECK_CIRCLE_SVG,
      hash: h,
      name: 'CheckCircleIcon'
    });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('icons'))) return;
  await knex('icons').where({ name: 'CheckCircleIcon' }).del();
}
