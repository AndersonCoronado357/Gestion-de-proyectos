// Agrega los iconos que usa el módulo design (cursor, mano, frame, star,
// etc.) — antes estaban hardcodeados como SVG inline en cada componente
// del editor.
//
// Idempotente: si ya existe el `name`, no inserta.

import type { Knex } from 'knex';
import crypto from 'node:crypto';

interface NewIcon {
  name: string;
  displayName: string;
  /** Inner sin el <svg> wrapper. Se envuelve abajo. */
  inner: string;
  /** Si el SVG necesita un strokeWidth distinto al default (2), lo
   *  declaramos en el wrapper. */
  strokeWidth?: number;
}

const ICONS: NewIcon[] = [
  {
    name: 'CursorArrowRaysIcon',
    displayName: 'Cursor con rayos',
    strokeWidth: 1.5,
    inner:
      '<path d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59"/>'
  },
  {
    name: 'HandIcon',
    displayName: 'Mano',
    inner:
      '<path d="M9 11V4a2 2 0 1 1 4 0v7M13 11V3a2 2 0 1 1 4 0v8M17 11V5a2 2 0 1 1 4 0v10a7 7 0 0 1-7 7h-1a7 7 0 0 1-7-7v-2.5L4 11a2 2 0 1 1 2-3l3 3"/>'
  },
  {
    name: 'MultiSelectIcon',
    displayName: 'Selección múltiple',
    strokeWidth: 1.6,
    inner:
      '<path d="M5 5h2M5 11h2M5 17h2M11 5h2M11 17h2M17 5h2M17 11h2M17 17h2" stroke-dasharray="2 2"/><circle cx="14" cy="14" r="2.5" fill="currentColor"/>'
  },
  {
    name: 'FrameIcon',
    displayName: 'Marco / Vista',
    inner: '<rect x="3" y="3" width="18" height="18" rx="2"/>'
  },
  {
    name: 'ContainerIcon',
    displayName: 'Contenedor',
    inner: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M3 9h18M9 21V9"/>'
  },
  {
    name: 'StarIcon',
    displayName: 'Estrella',
    inner:
      '<path d="M12 2 14.91 8.41 22 9.27 16.73 14.14 18.18 21.02 12 17.27 5.82 21.02 7.27 14.14 2 9.27 9.09 8.41 Z"/>'
  },
  {
    name: 'ArrowLeftIcon',
    displayName: 'Flecha izquierda',
    inner: '<path d="M19 12H5M12 19l-7-7 7-7"/>'
  }
];

function buildSvg(inner: string, strokeWidth: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

const hashOf = (svg: string): string =>
  crypto.createHash('sha256').update(svg.trim()).digest('hex');

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('icons'))) return;
  const hasDisplay = await knex.schema.hasColumn('icons', 'display_name');

  for (const ic of ICONS) {
    const existing = await knex('icons').where({ name: ic.name }).first('id');
    if (existing) continue;
    const svg = buildSvg(ic.inner, ic.strokeWidth ?? 2);
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
