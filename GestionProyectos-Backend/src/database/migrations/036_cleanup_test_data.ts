// Limpieza de basura acumulada por sesiones de prueba:
//   - Tablas SQL "ander", "anderson", "anderson2..4", "hola", "prueba", "try"
//     creadas por migrations de prueba (028-031 y similares).
//   - Filas soft-deleted en `submodules` y `modules` que el seed de
//     Administración iba marcando pero nunca limpiando.
//   - DesignerIcon huérfano (su único uso era el submódulo "Diseñador"
//     que se removió cuando separamos módulos y submódulos).
//
// Idempotente: usa IF EXISTS para tablas y deleted_at IS NOT NULL para
// filas, así que correrla dos veces no rompe nada.

import type { Knex } from 'knex';

const TEST_TABLES = [
  'ander',
  'anderson',
  'anderson2',
  'anderson3',
  'anderson4',
  'hola',
  'prueba',
  'try'
];

export async function up(knex: Knex): Promise<void> {
  // 1. Drop tablas de prueba (creadas por migrations 028-031 y previas).
  for (const t of TEST_TABLES) {
    // `try` es palabra reservada — la encerramos en brackets.
    const quoted = `[${t}]`;
    await knex.raw(`IF OBJECT_ID(N'${t}', N'U') IS NOT NULL DROP TABLE ${quoted}`);
  }

  // 2. Hard-delete de submódulos soft-deleted — sólo limpieza, ningún
  //    submódulo "vivo" debería quedar afectado.
  await knex('submodules').whereNotNull('deleted_at').delete();

  // 3. Hard-delete de módulos soft-deleted (típicamente "Nuevo módulo"
  //    que quedó marcado por el seed).
  await knex('modules').whereNotNull('deleted_at').delete();

  // 4. Borrar DesignerIcon (huérfano).
  await knex('icons').where({ name: 'DesignerIcon' }).delete();
}

export async function down(): Promise<void> {
  // Sin rollback: si querés volver, corré los seeds que recreaban las
  // tablas de prueba o el seed del sidebar.
}
