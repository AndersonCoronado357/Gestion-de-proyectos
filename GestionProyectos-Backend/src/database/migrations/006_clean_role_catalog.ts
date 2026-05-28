// Limpieza del catálogo de roles:
//
//   1. Renombramos "superadmin" → "Super admin" (es lo que ve el usuario).
//   2. Hard-delete de todos los demás roles del seed inicial — la gestión
//      de roles ahora vive 100% en la UI, no en una lista fija.
//
// Antes del cambio el seed plantaba ~18 roles "funcionales"
// (Médico general, Cirujano, etc.) que sólo servían como opciones
// hardcoded en el front.  Ahora cualquier rol nuevo se crea desde
// /api/roles y se asigna a los usuarios desde el panel lateral.
//
// La migración es destructiva (hard-delete) pero idempotente: si se
// corre dos veces no rompe.

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // 1) Rename — protegido contra colisiones (si alguien ya tiene
  //    "Super admin", lo dejamos como está y se borra el "superadmin"
  //    duplicado en el paso 2).
  await knex.raw(`
    IF EXISTS (SELECT 1 FROM roles WHERE name = N'superadmin')
       AND NOT EXISTS (SELECT 1 FROM roles WHERE name = N'Super admin')
    BEGIN
      UPDATE roles SET name = N'Super admin' WHERE name = N'superadmin';
    END
  `);

  // 2) Limpiar pivots de roles no-super.  Hay que hacerlo antes del
  //    DELETE de roles porque hay FKs (role_id) sin cascade.
  await knex.raw(
    `DELETE FROM user_roles      WHERE role_id IN (SELECT id FROM roles WHERE is_super = 0)`
  );
  await knex.raw(
    `DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE is_super = 0)`
  );
  await knex.raw(
    `DELETE FROM role_services    WHERE role_id IN (SELECT id FROM roles WHERE is_super = 0)`
  );

  // 3) Hard-delete de los roles no-super.
  await knex.raw(`DELETE FROM roles WHERE is_super = 0`);
}

export async function down(knex: Knex): Promise<void> {
  // No reponemos los 18 roles funcionales (su lugar ahora es la UI).
  // Sólo deshacemos el rename para no dejar inconsistencias con el seed.
  await knex.raw(`
    IF EXISTS (SELECT 1 FROM roles WHERE name = N'Super admin')
       AND NOT EXISTS (SELECT 1 FROM roles WHERE name = N'superadmin')
    BEGIN
      UPDATE roles SET name = N'superadmin' WHERE name = N'Super admin';
    END
  `);
}
