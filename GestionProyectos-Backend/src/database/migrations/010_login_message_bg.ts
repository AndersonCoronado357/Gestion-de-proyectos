// Añade a cada mensaje del login el fondo de círculos que usa (`bg_variant`),
// para poder escogerlo desde Administración → "Contenido del login".

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('login_messages', 'bg_variant');
  if (!hasColumn) {
    await knex.raw(
      `ALTER TABLE login_messages ADD bg_variant INT NOT NULL CONSTRAINT DF_login_messages_bg DEFAULT 0`
    );
  }
}

export async function down(knex: Knex): Promise<void> {
  const hasColumn = await knex.schema.hasColumn('login_messages', 'bg_variant');
  if (hasColumn) {
    // Hay que soltar el DEFAULT constraint antes de la columna en SQL Server.
    await knex.raw(`
      IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = 'DF_login_messages_bg')
        ALTER TABLE login_messages DROP CONSTRAINT DF_login_messages_bg;
      ALTER TABLE login_messages DROP COLUMN bg_variant;
    `);
  }
}
