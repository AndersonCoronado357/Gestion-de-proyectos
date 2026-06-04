// Pone nombre técnico (`name`) y nombre visible (`display_name`) a los
// iconos legacy que se sembraron antes de la migración 013 y se quedaron
// como NULL. Se identifican por la sub-cadena característica de su SVG;
// si el match no aparece, simplemente se ignoran (idempotente).

import type { Knex } from 'knex';

interface LegacyIcon {
  /** Sub-cadena única dentro del SVG para identificarlo. */
  match: string;
  name: string;
  displayName: string;
}

const LEGACY_ICONS: LegacyIcon[] = [
  // Escudo (Sidebar > Administración por defecto).
  { match: 'M12 2 4 5v6c0 5 3.5 9.5 8 11', name: 'ShieldDefaultIcon', displayName: 'Escudo' },
  // Caja 3D.
  { match: 'm21 8-9-5-9 5 9 5 9-5Z', name: 'BoxDefaultIcon', displayName: 'Caja 3D' },
  // Llave.
  { match: 'circle cx="7.5" cy="15.5" r="4.5"', name: 'KeyDefaultIcon', displayName: 'Llave' },
  // Usuario (persona genérica).
  { match: 'circle cx="12" cy="8" r="4"', name: 'UserDefaultIcon', displayName: 'Usuario' },
  // Puzzle.
  { match: 'M4 7h4V4a2 2 0 1 1 4 0v3h4v4', name: 'PuzzleIcon', displayName: 'Puzzle' },
  // Paneles (split-view).
  { match: 'rect x="3" y="4" width="18" height="16" rx="2"', name: 'PanelsIcon', displayName: 'Paneles' },
  // Matraz / Laboratorio default.
  { match: 'M9 2v6L4 18a2 2 0 0 0 1.73 3', name: 'FlaskIcon', displayName: 'Matraz' },
  // Documento (file con esquina doblada).
  { match: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12', name: 'DocumentIcon', displayName: 'Documento' }
];

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('icons'))) return;
  if (!(await knex.schema.hasColumn('icons', 'display_name'))) return;
  const rows = (await knex('icons').whereNull('name').select('id', 'svg')) as Array<{
    id: number;
    svg: string;
  }>;
  for (const r of rows) {
    const match = LEGACY_ICONS.find((m) => r.svg.includes(m.match));
    if (!match) continue;
    // Si el name técnico ya está en uso por otra fila, lo dejamos como null
    // y sólo asignamos display_name (no podemos duplicar `name`).
    const dup = await knex('icons').where({ name: match.name }).whereNot('id', r.id).first('id');
    await knex('icons')
      .where({ id: r.id })
      .update({
        name: dup ? null : match.name,
        display_name: match.displayName
      });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('icons'))) return;
  for (const m of LEGACY_ICONS) {
    await knex('icons').where({ name: m.name }).update({ name: null, display_name: null });
  }
}
