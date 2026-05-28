// Mensajes del panel del login (editables desde Administración →
// "Contenido del login"). Cada fila es un mensaje con su orden.
//
// `body` en vez de `text` porque TEXT es un tipo/keyword reservado en SQL Server.

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE login_messages (
      id          INT            IDENTITY(1,1) PRIMARY KEY,
      title       NVARCHAR(200)  NOT NULL,
      body        NVARCHAR(500)  NOT NULL DEFAULT '',
      position    INT            NOT NULL DEFAULT 0,
      created_at  DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
      updated_at  DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME()
    )
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TABLE IF EXISTS login_messages');
}
