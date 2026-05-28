// Cambia el UNIQUE de `roles.name` para que sólo cuente filas activas
// (deleted_at IS NULL).
//
// El constraint original `uq_roles_name` aplica a TODAS las filas, lo
// que rompe el flujo cotidiano: si soft-eliminás un rol llamado "Foo",
// la fila sigue ocupando el slot y nadie puede volver a crear (o
// renombrar a) "Foo" hasta que la borres a mano de la tabla.  Como el
// front hace soft-delete y el update repite el constraint, cualquier
// PUT que toque el nombre terminaba en 500 — y por estar en la misma
// transacción, los permisos del PUT tampoco se persistían.
//
// SQL Server soporta UNIQUE filtrado: `CREATE UNIQUE INDEX ... WHERE …`.

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`ALTER TABLE roles DROP CONSTRAINT uq_roles_name`);
  await knex.raw(`
    CREATE UNIQUE INDEX ux_roles_name_active
       ON roles (name)
    WHERE deleted_at IS NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX ux_roles_name_active ON roles`);
  await knex.raw(`
    ALTER TABLE roles
       ADD CONSTRAINT uq_roles_name UNIQUE (name)
  `);
}
