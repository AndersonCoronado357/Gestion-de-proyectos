// Siembra el GoogleIcon en la tabla `icons`.
//
// La migración 013 sembró los iconos "outline" (los que usan {...baseProps}).
// GoogleIcon es multicolor (fills propios), así que quedó fuera. Lo agregamos
// para que TODOS los iconos de `shared/components/icons/index.tsx` estén en la
// BD y el front pueda dejar de hardcodearlos.

import type { Knex } from 'knex';
import crypto from 'node:crypto';

const GOOGLE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#4285F4" d="M23.06 12.25c0-.78-.07-1.54-.2-2.27H12v4.3h6.19c-.27 1.43-1.08 2.65-2.3 3.46v2.87h3.71c2.17-2 3.46-4.94 3.46-8.36z"/><path fill="#34A853" d="M12 23.5c3.13 0 5.74-1.04 7.65-2.81l-3.71-2.87c-1.03.69-2.34 1.1-3.94 1.1-3.03 0-5.6-2.04-6.51-4.79H1.66v3c1.92 3.79 5.84 6.37 10.34 6.37z"/><path fill="#FBBC04" d="M5.49 14.13c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18V6.77H1.66C.91 8.27.5 9.96.5 11.95s.41 3.68 1.16 5.18l3.83-2.99z"/><path fill="#EA4335" d="M12 5.13c1.71 0 3.24.59 4.45 1.74l3.29-3.29C17.74 1.7 15.13.5 12 .5 7.5.5 3.58 3.08 1.66 6.87l3.83 2.99c.91-2.75 3.48-4.79 6.51-4.79z"/></svg>`;

const hashOf = (svg: string): string =>
  crypto.createHash('sha256').update(svg.trim()).digest('hex');

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('icons'))) return;
  const h = hashOf(GOOGLE_SVG);
  const existing = await knex('icons').where({ hash: h }).first('id');
  if (existing) {
    await knex('icons')
      .where({ id: (existing as { id: number }).id })
      .update({ name: 'GoogleIcon' });
  } else {
    await knex('icons').insert({ svg: GOOGLE_SVG, hash: h, name: 'GoogleIcon' });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('icons'))) return;
  await knex('icons').where({ name: 'GoogleIcon' }).del();
}
