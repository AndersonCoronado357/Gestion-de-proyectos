// Generador de módulos (SOLO DESARROLLO).
//
// Visión: cada submódulo que se construye genera SUS PROPIOS archivos en el
// proyecto, con la arquitectura hexagonal COMPLETA. Para garantizar que nunca
// falte nada ni se desincronice, NO usamos plantillas hardcodeadas: clonamos
// el módulo de referencia REAL (`module-x`) y solo renombramos los tokens.
// Así module-x es la ÚNICA fuente de verdad — si mejora, los clones mejoran.
//
// El navegador no escribe en disco → lo hace el backend. Bloqueado en prod.

import type { Knex } from 'knex';
import { Router } from 'express';
import path from 'node:path';
import fs from 'node:fs';
import Joi from 'joi';

const authMiddleware = require('../../shared/middlewares/auth.middleware');
const validate = require('../../shared/middlewares/validate.middleware');
const env = require('../../config/env');

const BACKEND_SRC = path.resolve(__dirname, '../../'); // GestionProyectos-Backend/src
const FRONTEND_SRC = path.resolve(__dirname, '../../../../GestionProyectos-Frontend/src');
const WORKSPACE = path.resolve(BACKEND_SRC, '../..'); // raíz del workspace

const TEMPLATE = 'module-x'; // módulo de referencia

const partsOf = (key: string): string[] => key.split('-').filter(Boolean);
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

function toKey(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
const toPascal = (key: string): string => partsOf(key).map(cap).join('');
const toCamel = (key: string): string => {
  const p = partsOf(key);
  return p.length ? p[0] + p.slice(1).map(cap).join('') : '';
};
const toSnake = (key: string): string => partsOf(key).join('_');

function nextNumber(dir: string): string {
  let max = 0;
  try {
    for (const f of fs.readdirSync(dir)) {
      const m = /^(\d+)/.exec(f);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    }
  } catch {
    /* carpeta inexistente */
  }
  return String(max + 1).padStart(3, '0');
}

// Reemplaza los tokens de module-x (en rutas Y contenido). Orden: específicos
// primero. Case-sensitive: ModuleX≠moduleX, module-x≠module_x.
function rename(str: string, key: string): string {
  const reps: ReadonlyArray<readonly [string, string]> = [
    ['ModuleX', toPascal(key)],
    ['MODULE_X', toSnake(key).toUpperCase()],
    ['module-x', key],
    ['module_x', toSnake(key)],
    ['moduleX', toCamel(key)]
  ];
  let out = str;
  for (const [from, to] of reps) out = out.split(from).join(to);
  return out;
}

// Copia recursiva del módulo plantilla, renombrando carpetas, archivos y
// contenido. Devuelve las rutas creadas (relativas al workspace).
function cloneModule(srcDir: string, destDir: string, key: string, written: string[]): void {
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, rename(entry.name, key));
    if (entry.isDirectory()) {
      cloneModule(srcPath, destPath, key, written);
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.writeFileSync(destPath, rename(fs.readFileSync(srcPath, 'utf8'), key), 'utf8');
      written.push(path.relative(WORKSPACE, destPath).split(path.sep).join('/'));
    }
  }
}

function migrationContent(key: string): string {
  const tableName = toSnake(key);
  return [
    `import type { Knex } from 'knex';`,
    ``,
    `export async function up(knex: Knex): Promise<void> {`,
    `  await knex.schema.createTable('${tableName}', (table) => {`,
    `    table.increments('id');`,
    `    table.string('name', 200).notNullable();`,
    `    table.string('description', 500).nullable();`,
    `    table.boolean('is_active').notNullable().defaultTo(true);`,
    `    table.timestamps(true, true);`,
    `  });`,
    `}`,
    ``,
    `export async function down(knex: Knex): Promise<void> {`,
    `  await knex.schema.dropTableIfExists('${tableName}');`,
    `}`,
    ``
  ].join('\n');
}

function seedContent(name: string): string {
  return [
    `import type { Knex } from 'knex';`,
    ``,
    `export async function seed(_knex: Knex): Promise<void> {`,
    `  // TODO: datos iniciales de ${name}.`,
    `}`,
    ``
  ].join('\n');
}

const schema = Joi.object({ name: Joi.string().trim().min(1).max(60).required() });

module.exports = (_db: Knex) => {
  const router = Router();

  router.post('/submodule', authMiddleware, validate(schema), (req, res, next) => {
    if (env.nodeEnv === 'production') {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'El generador de módulos solo está disponible en desarrollo.'
      });
      return;
    }
    try {
      const name: string = req.body.name.trim();
      const key = toKey(name);
      if (!key || key === TEMPLATE) {
        res.status(400).json({ error: 'BAD_REQUEST', message: 'Nombre inválido.' });
        return;
      }

      const beModuleDir = path.join(BACKEND_SRC, 'modules', key);
      const feModuleDir = path.join(FRONTEND_SRC, 'modules', key);
      if (fs.existsSync(beModuleDir) || fs.existsSync(feModuleDir)) {
        res.status(409).json({ error: 'CONFLICT', message: `Ya existe un módulo "${key}".` });
        return;
      }

      const beTemplate = path.join(BACKEND_SRC, 'modules', TEMPLATE);
      const feTemplate = path.join(FRONTEND_SRC, 'modules', TEMPLATE);
      if (!fs.existsSync(beTemplate) || !fs.existsSync(feTemplate)) {
        res.status(500).json({
          error: 'NO_TEMPLATE',
          message: 'No se encontró el módulo de referencia module-x.'
        });
        return;
      }

      const written: string[] = [];
      cloneModule(beTemplate, beModuleDir, key, written);
      cloneModule(feTemplate, feModuleDir, key, written);

      // Migración + seed (module-x usa su propia tabla; el clon necesita la suya).
      const migNum = nextNumber(path.join(BACKEND_SRC, 'database', 'migrations'));
      const migPath = path.join(BACKEND_SRC, 'database', 'migrations', `${migNum}_create_${key}.ts`);
      fs.writeFileSync(migPath, migrationContent(key), 'utf8');
      written.push(path.relative(WORKSPACE, migPath).split(path.sep).join('/'));

      const seedNum = nextNumber(path.join(BACKEND_SRC, 'database', 'seeds'));
      const seedPath = path.join(BACKEND_SRC, 'database', 'seeds', `${seedNum}_${key}.seed.ts`);
      fs.writeFileSync(seedPath, seedContent(name), 'utf8');
      written.push(path.relative(WORKSPACE, seedPath).split(path.sep).join('/'));

      res.status(201).json({
        key,
        name: toPascal(key),
        count: written.length,
        files: written.sort()
      });
    } catch (e) {
      next(e);
    }
  });

  return router;
};
