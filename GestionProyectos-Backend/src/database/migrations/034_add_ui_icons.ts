// Agrega iconos que estaban hardcoded en componentes del frontend
// (Alert, Toast, Modal, Select, Accordion, DataTable Pagination).
// Sin ellos no se puede cumplir la regla "todos los iconos en BD".
//
// Idempotente: si ya existe el `name`, no inserta.

import type { Knex } from 'knex';
import crypto from 'node:crypto';

interface NewIcon {
  name: string;
  displayName: string;
  inner: string;
}

const ICONS: NewIcon[] = [
  {
    name: 'ChevronsLeftIcon',
    displayName: 'Doble flecha izquierda',
    inner: '<path d="m11 17-5-5 5-5"/><path d="m18 17-5-5 5-5"/>'
  },
  {
    name: 'ChevronsRightIcon',
    displayName: 'Doble flecha derecha',
    inner: '<path d="m13 17 5-5-5-5"/><path d="m6 17 5-5-5-5"/>'
  },
  {
    name: 'WarningTriangleIcon',
    displayName: 'Triángulo de advertencia',
    inner:
      '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><path d="M12 9v4"/><path d="M12 17h.01"/>'
  },
  {
    name: 'HelpCircleIcon',
    displayName: 'Ayuda',
    inner:
      '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>'
  },
  {
    name: 'AlertCircleIcon',
    displayName: 'Alerta circular',
    inner:
      '<circle cx="12" cy="12" r="10"/><path d="M12 7v6"/><path d="M12 17h.01"/>'
  },
  {
    name: 'XCircleIcon',
    displayName: 'X circular',
    inner:
      '<circle cx="12" cy="12" r="10"/><path d="M15 9 9 15"/><path d="m9 9 6 6"/>'
  },
  {
    name: 'MenuIcon',
    displayName: 'Menú',
    inner: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>'
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
