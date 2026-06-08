// Asigna `icon_id` a los módulos/submódulos que estaban sin icono de
// catálogo:
//   - Submódulo "Submódulos" (page-builder)         → PuzzleIcon
//   - Módulo "APIs"                                 → ApiIcon
//   - Submódulo "Hoja de cálculo" (google-sheets)   → SpreadsheetIcon (nuevo)
//   - Submódulo "Drive" (google-drive)              → FolderIcon
//   - Submódulo "Calendario" (google-calendar)      → CalendarIcon
//   - Submódulo "Gmail" (google-gmail)              → MailIcon
//   - Submódulo "Documentos" (google-docs)          → DocumentIcon
//   - Submódulo "Tareas" (google-tasks)             → ListIcon
//   - Submódulo "Meet" (google-meet)                → VideoIcon (nuevo)
//
// Si el icono nuevo (SpreadsheetIcon / VideoIcon) ya existe, no lo
// re-inserta (idempotente). Si el submódulo no existe, lo saltea.

import type { Knex } from 'knex';
import crypto from 'node:crypto';

interface NewIcon {
  name: string;
  displayName: string;
  inner: string;
}

const NEW_ICONS: NewIcon[] = [
  {
    name: 'SpreadsheetIcon',
    displayName: 'Hoja de cálculo',
    // Grilla 3x3 — celdas de una planilla.
    inner:
      '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/>'
  },
  {
    name: 'VideoIcon',
    displayName: 'Video',
    // Cámara de video (rectángulo + triángulo lateral) — para Meet.
    inner:
      '<path d="M22 8 16 12 22 16 22 8z"/><rect x="2" y="6" width="14" height="12" rx="2"/>'
  }
];

function buildSvg(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
}

const hashOf = (svg: string): string =>
  crypto.createHash('sha256').update(svg.trim()).digest('hex');

interface Mapping {
  type: 'module' | 'submodule';
  matchBy: 'folder_key' | 'name';
  match: string;
  iconName: string;
}

const MAPPINGS: Mapping[] = [
  { type: 'submodule', matchBy: 'folder_key', match: 'page-builder', iconName: 'PuzzleIcon' },
  { type: 'module', matchBy: 'name', match: 'APIs', iconName: 'ApiIcon' },
  { type: 'submodule', matchBy: 'folder_key', match: 'google-sheets', iconName: 'SpreadsheetIcon' },
  { type: 'submodule', matchBy: 'folder_key', match: 'google-drive', iconName: 'FolderIcon' },
  { type: 'submodule', matchBy: 'folder_key', match: 'google-calendar', iconName: 'CalendarIcon' },
  { type: 'submodule', matchBy: 'folder_key', match: 'google-gmail', iconName: 'MailIcon' },
  { type: 'submodule', matchBy: 'folder_key', match: 'google-docs', iconName: 'DocumentIcon' },
  { type: 'submodule', matchBy: 'folder_key', match: 'google-tasks', iconName: 'ListIcon' },
  { type: 'submodule', matchBy: 'folder_key', match: 'google-meet', iconName: 'VideoIcon' }
];

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('icons'))) return;
  const hasDisplay = await knex.schema.hasColumn('icons', 'display_name');

  // 1. Insertar iconos nuevos si no existen.
  for (const ic of NEW_ICONS) {
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

  // 2. Para cada mapping, buscar el icon_id por nombre y aplicarlo al
  //    módulo/submódulo correspondiente.
  for (const m of MAPPINGS) {
    const icon = await knex('icons').where({ name: m.iconName }).first('id');
    if (!icon) continue;
    const table = m.type === 'module' ? 'modules' : 'submodules';
    await knex(table)
      .where(m.matchBy, m.match)
      .whereNull('deleted_at')
      .update({ icon_id: icon.id });
  }
}

export async function down(knex: Knex): Promise<void> {
  // Limpiar icon_id en las filas afectadas y borrar los iconos nuevos
  // si nadie más los usa.
  for (const m of MAPPINGS) {
    const table = m.type === 'module' ? 'modules' : 'submodules';
    await knex(table).where(m.matchBy, m.match).update({ icon_id: null });
  }
  for (const ic of NEW_ICONS) {
    await knex('icons').where({ name: ic.name }).delete();
  }
}
