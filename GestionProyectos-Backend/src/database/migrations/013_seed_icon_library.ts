// Siembra la librería de iconos del código en la tabla `icons`.
//
// Objetivo: que TODOS los iconos que usa la app estén en la BD (no sólo los
// del nav). Lee el set compartido del frontend
// (`shared/components/icons/index.tsx`), extrae cada icono "outline" estándar
// (los que usan `{...baseProps}`) y lo guarda como SVG en `icons`, con su
// nombre y deduplicado por hash. Idempotente. Si el archivo del frontend no
// está disponible (ej. build sin el front al lado), es no-op.
//
// Los iconos especiales (Google/React/TypeScript) se omiten: no son iconos
// de propósito general para elegir, sino de componentes específicos.

import type { Knex } from 'knex';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const ICONS_FILE = path.resolve(
  __dirname,
  '../../../../GestionProyectos-Frontend/src/shared/components/icons/index.tsx'
);

const hashOf = (svg: string): string =>
  crypto.createHash('sha256').update(svg.trim()).digest('hex');

// Envuelve el contenido interno en un <svg> estilo nav: viewBox 24×24, sin
// width/height fijos (lo dimensiona el contenedor) y stroke=currentColor
// (toma el color del tema).
function buildSvg(inner: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner.trim()}</svg>`;
}

function parseIcons(src: string): Array<{ name: string; svg: string }> {
  const out: Array<{ name: string; svg: string }> = [];
  const re =
    /export const (\w+)\s*=\s*\([^)]*\)\s*=>\s*\(\s*<svg\b([^>]*)>([\s\S]*?)<\/svg>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const [, name, attrs, inner] = m;
    if (!attrs.includes('...baseProps')) continue; // sólo los outline estándar
    if (!inner.trim()) continue;
    out.push({ name, svg: buildSvg(inner) });
  }
  return out;
}

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('icons'))) return; // requiere migración 011

  if (!(await knex.schema.hasColumn('icons', 'name'))) {
    await knex.schema.alterTable('icons', (t) => {
      t.string('name', 80).nullable();
    });
  }

  let src: string;
  try {
    src = fs.readFileSync(ICONS_FILE, 'utf8');
  } catch {
    // eslint-disable-next-line no-console
    console.log('[013] index.tsx del frontend no encontrado → se omite el seed de iconos.');
    return;
  }

  const icons = parseIcons(src);
  let inserted = 0;
  for (const { name, svg } of icons) {
    const h = hashOf(svg);
    const existing = await knex('icons').where({ hash: h }).first('id', 'name');
    if (existing) {
      if (!(existing as { name: string | null }).name) {
        await knex('icons')
          .where({ id: (existing as { id: number }).id })
          .update({ name });
      }
    } else {
      await knex('icons').insert({ svg, hash: h, name });
      inserted++;
    }
  }
  // eslint-disable-next-line no-console
  console.log(
    `[013] librería de iconos: ${icons.length} detectados, ${inserted} nuevos en BD.`
  );
}

export async function down(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('icons'))) return;
  // Borra sólo los iconos de biblioteca (con `name`) que NO estén en uso.
  const usedIds = new Set<number>();
  for (const table of ['modules', 'submodules'] as const) {
    if (await knex.schema.hasColumn(table, 'icon_id')) {
      const rows = (await knex(table)
        .whereNotNull('icon_id')
        .distinct('icon_id')) as Array<{ icon_id: number }>;
      rows.forEach((r) => usedIds.add(r.icon_id));
    }
  }
  const named = (await knex('icons')
    .whereNotNull('name')
    .select('id')) as Array<{ id: number }>;
  const toDelete = named.map((r) => r.id).filter((id) => !usedIds.has(id));
  if (toDelete.length > 0) await knex('icons').whereIn('id', toDelete).del();
}
