// Cambios para que los módulos/submódulos sean dinámicos en el sidebar:
//
//   1. Las columnas `icon` ahora guardan SVG completo (inline), no códigos
//      de fuente de iconos. NVARCHAR(MAX) → hasta 2GB, más que de sobra.
//   2. `submodules.path` — la ruta que abre el submódulo en el front.
//   3. `submodules.folder_key` — identifica qué carpeta del front renderiza
//      la página (ej. 'users', 'components'). El front mantiene un mapa
//      folder_key → React component para resolver la vista real.
//
// Mantengo el patrón knex.raw porque seguimos en SQL Server.

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE modules    ALTER COLUMN icon NVARCHAR(MAX) NULL`);
  await knex.raw(`ALTER TABLE submodules ALTER COLUMN icon NVARCHAR(MAX) NULL`);

  await knex.raw(`ALTER TABLE submodules ADD path        NVARCHAR(255) NULL`);
  await knex.raw(`ALTER TABLE submodules ADD folder_key  NVARCHAR(100) NULL`);

  // Filtered unique: dos submódulos vivos no pueden compartir folder_key.
  // Distintas filas con folder_key = NULL son ignoradas por el filtro.
  await knex.raw(`
    CREATE UNIQUE INDEX ux_submodules_folder_key
    ON submodules (folder_key)
    WHERE deleted_at IS NULL AND folder_key IS NOT NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX ux_submodules_folder_key ON submodules`);
  await knex.raw(`ALTER TABLE submodules DROP COLUMN folder_key`);
  await knex.raw(`ALTER TABLE submodules DROP COLUMN path`);

  await knex.raw(`ALTER TABLE submodules ALTER COLUMN icon NVARCHAR(100) NULL`);
  await knex.raw(`ALTER TABLE modules    ALTER COLUMN icon NVARCHAR(100) NULL`);
}
