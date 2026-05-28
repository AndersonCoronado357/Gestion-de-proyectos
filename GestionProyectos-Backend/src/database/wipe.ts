// Script "nuclear": borra TODAS las tablas, foreign keys, triggers,
// procedimientos almacenados, vistas y funciones definidas por el usuario
// del schema dbo de la base apuntada por `env.db.*`.
//
// USO:
//   npm run db:wipe                      → pide confirmación
//   npm run db:wipe -- --yes             → corre sin pedir confirmación
//
// Se ejecuta vía ts-node (ver script en package.json).

import readline from 'readline';

const knex = require('knex');
const env = require('../config/env');
const knexConfig = require('../config/database');

async function confirm(): Promise<boolean> {
  if (process.argv.includes('--yes') || process.argv.includes('-y')) {
    return true;
  }
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  const answer = await new Promise<string>((resolve) => {
    rl.question(
      `⚠️  Esto BORRARÁ todas las tablas de "${env.db.name}" en ${env.db.host}. Escribe "borrar" para confirmar: `,
      (a) => {
        rl.close();
        resolve(a.trim().toLowerCase());
      }
    );
  });
  return answer === 'borrar';
}

interface ErrorLike {
  message?: string;
  code?: string;
}

function asErrorLike(err: unknown): ErrorLike {
  if (err && typeof err === 'object') return err as ErrorLike;
  return { message: String(err) };
}

(async () => {
  if (!(await confirm())) {
    console.log('[db:wipe] Cancelado.');
    process.exit(0);
  }

  const db = knex(knexConfig[env.nodeEnv] || knexConfig.development);

  console.log(`[db:wipe] Conectando a ${env.db.host}:${env.db.port}/${env.db.name}...`);

  try {
    // 1) Drop todas las foreign keys
    console.log('[db:wipe] Dropping foreign keys...');
    await db.raw(`
      DECLARE @sql NVARCHAR(MAX) = N'';
      SELECT @sql += N'ALTER TABLE [' + s.name + N'].[' + t.name + N'] DROP CONSTRAINT [' + fk.name + N'];' + CHAR(13)
      FROM sys.foreign_keys fk
      JOIN sys.tables  t ON fk.parent_object_id = t.object_id
      JOIN sys.schemas s ON t.schema_id = s.schema_id;
      EXEC sp_executesql @sql;
    `);

    // 2) Drop todos los triggers de usuario
    console.log('[db:wipe] Dropping triggers...');
    await db.raw(`
      DECLARE @sql NVARCHAR(MAX) = N'';
      SELECT @sql += N'DROP TRIGGER [' + s.name + N'].[' + tr.name + N'];' + CHAR(13)
      FROM sys.triggers tr
      JOIN sys.tables t  ON tr.parent_id = t.object_id
      JOIN sys.schemas s ON t.schema_id = s.schema_id
      WHERE tr.is_ms_shipped = 0;
      EXEC sp_executesql @sql;
    `);

    // 3) Drop todas las vistas de usuario
    console.log('[db:wipe] Dropping views...');
    await db.raw(`
      DECLARE @sql NVARCHAR(MAX) = N'';
      SELECT @sql += N'DROP VIEW [' + s.name + N'].[' + v.name + N'];' + CHAR(13)
      FROM sys.views v
      JOIN sys.schemas s ON v.schema_id = s.schema_id
      WHERE v.is_ms_shipped = 0;
      EXEC sp_executesql @sql;
    `);

    // 4) Drop todos los stored procedures de usuario
    console.log('[db:wipe] Dropping stored procedures...');
    await db.raw(`
      DECLARE @sql NVARCHAR(MAX) = N'';
      SELECT @sql += N'DROP PROCEDURE [' + s.name + N'].[' + p.name + N'];' + CHAR(13)
      FROM sys.procedures p
      JOIN sys.schemas s ON p.schema_id = s.schema_id
      WHERE p.is_ms_shipped = 0;
      EXEC sp_executesql @sql;
    `);

    // 5) Drop todas las funciones definidas por usuario
    console.log('[db:wipe] Dropping user functions...');
    await db.raw(`
      DECLARE @sql NVARCHAR(MAX) = N'';
      SELECT @sql += N'DROP FUNCTION [' + s.name + N'].[' + o.name + N'];' + CHAR(13)
      FROM sys.objects o
      JOIN sys.schemas s ON o.schema_id = s.schema_id
      WHERE o.type IN ('FN', 'IF', 'TF') AND o.is_ms_shipped = 0;
      EXEC sp_executesql @sql;
    `);

    // 6) Drop todas las tablas (incluida knex_migrations)
    console.log('[db:wipe] Dropping tables...');
    await db.raw(`
      DECLARE @sql NVARCHAR(MAX) = N'';
      SELECT @sql += N'DROP TABLE [' + s.name + N'].[' + t.name + N'];' + CHAR(13)
      FROM sys.tables t
      JOIN sys.schemas s ON t.schema_id = s.schema_id;
      EXEC sp_executesql @sql;
    `);

    console.log('[db:wipe] ✅ Base de datos limpia. Ya puedes correr `npm run db:migrate`.');
  } catch (err: unknown) {
    const e = asErrorLike(err);
    console.error('[db:wipe] ❌ Error:', e.message);
    if (e.code) console.error('         code:', e.code);
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
})();
