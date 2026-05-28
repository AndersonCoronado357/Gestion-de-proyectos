// Seed inicial — catálogos base + usuarios de prueba.
//
// Credenciales por defecto (cámbialas en producción):
//   admin / admin123    — super admin, ve todo
//   test  / test1234    — usuario sin roles, sirve para probar el gating
//
// Idempotente: cada INSERT chequea con NOT EXISTS, podés correrla varias
// veces sin duplicar nada.  Los usuarios legacy (`doctor1`, `nurse1`) que
// hayan quedado de seeds anteriores se soft-deletean al final.

import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';

export async function seed(knex: Knex): Promise<void> {
  // ============================================================
  //  Catálogos base
  //  (Los módulos/submódulos del sidebar viven en el seed 002 —
  //   ése es el "tree" que carga el front desde /api/navigation.)
  // ============================================================

  // El único rol que el sistema mantiene es "Super admin" (bypass total).
  // El resto se crea desde la UI de Roles & Permisos — el seed no impone
  // un catálogo fijo (eso obligaba a sincronizar el front cada vez que
  // alguien quería agregar/quitar un rol "funcional").
  await knex.raw(`
    INSERT INTO roles (name, description, is_super)
    SELECT N'Super admin', N'Acceso total al sistema', 1
    WHERE NOT EXISTS (SELECT 1 FROM roles r WHERE r.name = N'Super admin')
  `);

  // Por compatibilidad con DBs creadas antes de la migration 006, si todavía
  // existe la fila "superadmin" la renombramos en lugar de duplicar.
  await knex.raw(`
    IF EXISTS (SELECT 1 FROM roles WHERE name = N'superadmin')
       AND NOT EXISTS (SELECT 1 FROM roles WHERE name = N'Super admin')
    BEGIN
      UPDATE roles SET name = N'Super admin' WHERE name = N'superadmin';
    END
  `);

  // El rol "Super admin" debe quedar marcado como super — si quedó creado
  // antes de la migration 005 sin el flag, lo seteamos acá.
  await knex.raw(`
    UPDATE roles SET is_super = 1 WHERE name = N'Super admin' AND is_super = 0
  `);

  await knex.raw(`
    INSERT INTO permissions (resource, action)
    SELECT v.resource, v.action
    FROM (VALUES
      (N'users', N'read'),
      (N'users', N'create'),
      (N'users', N'update'),
      (N'users', N'delete'),
      (N'users', N'export')
    ) AS v(resource, action)
    WHERE NOT EXISTS (
      SELECT 1 FROM permissions p
      WHERE p.resource = v.resource AND p.action = v.action
    )
  `);

  // Catálogo de cargos en `services`.  El `code` es el identificador
  // estable que usa el front (espejo de la antigua constante CARGOS).
  await knex.raw(`
    INSERT INTO services (code, description)
    SELECT v.code, v.description
    FROM (VALUES
      (N'medico-general',       N'Médico general'),
      (N'medico-especialista',  N'Médico especialista'),
      (N'cirujano',             N'Cirujano'),
      (N'anestesiologo',        N'Anestesiólogo'),
      (N'enfermeria',           N'Enfermería'),
      (N'auxiliar-enfermeria',  N'Auxiliar de enfermería'),
      (N'recepcion',            N'Recepción'),
      (N'admision',             N'Admisión'),
      (N'facturacion',          N'Facturación'),
      (N'auditoria',            N'Auditoría'),
      (N'farmaceutico',         N'Farmacéutico'),
      (N'laboratorista',        N'Laboratorista'),
      (N'tecnico-imagenes',     N'Técnico de imágenes'),
      (N'paramedico',           N'Paramédico'),
      (N'camillero',            N'Camillero'),
      (N'director-medico',      N'Director médico'),
      (N'coordinador-clinico',  N'Coordinador clínico'),
      (N'administrador',        N'Administrador del sistema')
    ) AS v(code, description)
    WHERE NOT EXISTS (SELECT 1 FROM services s WHERE s.code = v.code)
  `);

  await knex.raw(`
    INSERT INTO ui_themes (name, preferences)
    SELECT v.name, v.preferences
    FROM (VALUES
      (N'default', N'{"mode":"light","accentHex":"#295072","fontFamily":"inter","fontSize":"md"}'),
      (N'dark',    N'{"mode":"dark","accentHex":"#295072","fontFamily":"inter","fontSize":"md"}')
    ) AS v(name, preferences)
    WHERE NOT EXISTS (SELECT 1 FROM ui_themes t WHERE t.name = v.name)
  `);

  // ============================================================
  //  Usuarios de prueba
  //  Las contraseñas se hashean con bcrypt (10 rounds) cada vez
  //  que se corre el seed — el hash cambia, pero compararlo con la
  //  contraseña plana sigue funcionando.
  // ============================================================

  const ROUNDS = 10;
  const adminHash = await bcrypt.hash('admin123', ROUNDS);
  const testHash = await bcrypt.hash('test1234', ROUNDS);

  await knex.raw(
    `
    INSERT INTO users (username, email, password_hash, first_name, last_name, phone, status)
    SELECT v.username, v.email, v.password_hash, v.first_name, v.last_name, v.phone, v.status
    FROM (VALUES
      (N'admin', N'admin@gestionproyectos.test', :adminHash, N'Admin', N'GestionProyectos', N'+57 300 000 0000', CAST(1 AS TINYINT)),
      (N'test',  N'test@gestionproyectos.test',  :testHash,  N'Usuario', N'Prueba', N'+57 300 000 1111', CAST(1 AS TINYINT))
    ) AS v(username, email, password_hash, first_name, last_name, phone, status)
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.username = v.username)
    `,
    { adminHash, testHash }
  );

  // Cleanup de usuarios legacy.  Soft-delete (la tabla `users` tiene FKs
  // entrantes de `sessions`, `user_roles`, etc. — hard-delete fallaría).
  // Cuando el seed corre por primera vez en una DB limpia, no hace nada.
  await knex.raw(`
    UPDATE users
       SET deleted_at = SYSUTCDATETIME()
     WHERE username IN (N'doctor1', N'nurse1')
       AND deleted_at IS NULL
  `);

  // El admin es el único con rol asignado por seed (Super admin).  El
  // usuario `test` arranca sin roles — sirve para verificar el gating
  // de permisos: por defecto no ve nada en el sidebar, y a medida que
  // el admin le va dando permisos desde la UI van apareciendo.
  await knex.raw(`
    INSERT INTO user_roles (user_id, role_id)
    SELECT u.id, r.id
    FROM users u
    CROSS JOIN roles r
    WHERE u.username = N'admin'
      AND r.name = N'Super admin'
      AND NOT EXISTS (
        SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id
      )
  `);
}
