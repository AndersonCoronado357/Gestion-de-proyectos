// Agrega iconos que usan los módulos de las APIs de Google
// (ExternalLinkIcon, CalendarIcon) a la tabla `icons`.
//
// Hasta ahora estos íconos no existían en la BD y los componentes los
// tenían como SVG hardcodeado — contra la regla del proyecto de que TODO
// icono debe venir de la BD vía `useIconSvg`.
//
// Idempotente: si ya existe el name, no inserta.

import type { Knex } from 'knex';
import crypto from 'node:crypto';

interface NewIcon {
  name: string;
  displayName: string;
  inner: string;
}

const ICONS: NewIcon[] = [
  {
    name: 'ExternalLinkIcon',
    displayName: 'Enlace externo',
    inner:
      '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5"/>'
  },
  {
    name: 'CalendarIcon',
    displayName: 'Calendario',
    inner:
      '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>'
  }
];

function buildSvg(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

const hashOf = (svg: string): string =>
  crypto.createHash('sha256').update(svg.trim()).digest('hex');

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('icons'))) return;
  const hasDisplay = await knex.schema.hasColumn('icons', 'display_name');

  for (const ic of ICONS) {
    const existing = await knex('icons').where({ name: ic.name }).first('id');
    if (existing) continue;
    const svg = buildSvg(ic.inner);
    const payload: Record<string, unknown> = {
      svg,
      hash: hashOf(svg),
      name: ic.name
    };
    if (hasDisplay) payload.display_name = ic.displayName;
    await knex('icons').insert(payload);
  }
}

export async function down(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('icons'))) return;
  for (const ic of ICONS) {
    await knex('icons').where({ name: ic.name }).del();
  }
}
