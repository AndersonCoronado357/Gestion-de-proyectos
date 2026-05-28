// Flag `is_super` en la tabla `roles`.
//
// Un rol con is_super=1 actúa como bypass: el usuario que lo tenga ve
// TODOS los módulos/submódulos/cargos automáticamente, sin que haya que
// mantener filas en `role_permissions` ni `role_services`.  Esto evita
// que cada vez que se cree un módulo nuevo haya que acordarse de
// "agregarle el permiso al rol super".
//
// El bypass se evalúa en el repositorio de usuarios (findWithAccessById)
// y se propaga al frontend vía PublicUser.isSuper.
//
// Nota: en esta migración la fila todavía se llama "superadmin"; la
// migration 006 la renombra a "Super admin".

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE roles ADD is_super BIT NOT NULL CONSTRAINT df_roles_is_super DEFAULT 0
  `);

  // Marcar el rol "superadmin" del seed inicial como super.  Idempotente:
  // si no existe, no pasa nada.
  await knex.raw(`
    UPDATE roles SET is_super = 1 WHERE name = N'superadmin'
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE roles DROP CONSTRAINT df_roles_is_super`);
  await knex.raw(`ALTER TABLE roles DROP COLUMN is_super`);
}
