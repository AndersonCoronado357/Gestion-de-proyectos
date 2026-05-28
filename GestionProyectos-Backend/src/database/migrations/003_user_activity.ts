// Agrega `last_activity_at` a la tabla `users`.
//
// Este timestamp lo actualiza el front con un heartbeat liviano cada vez
// que detecta input del usuario (mouse, teclado, scroll, touch).  No es
// el `last_login_at` — que registra el momento de autenticarse — sino
// la última señal de "este usuario está usando la app ahora mismo".
//
// El "estado de inactividad" no es un flag explícito: se deriva.  Un
// usuario está "activo" si `last_activity_at > now - 10 min`, "inactivo"
// si es más viejo (o NULL).  Esto evita escribir transiciones explícitas
// y mantiene el modelo simple.

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE users ADD last_activity_at DATETIME2 NULL`);
  await knex.raw(
    `CREATE INDEX ix_users_last_activity ON users (last_activity_at) WHERE deleted_at IS NULL`
  );
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX ix_users_last_activity ON users`);
  await knex.raw(`ALTER TABLE users DROP COLUMN last_activity_at`);
}
