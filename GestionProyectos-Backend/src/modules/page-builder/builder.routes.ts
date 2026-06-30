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
const DesignRepositoryImpl = require('../design/adapters/exit/design.repository.impl');
const getProjectUC = require('../design/use-cases/getProject');
import { serializeBlock, resetStateCounter, type SerializeResult } from './block-serializers';

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
function cloneModule(srcDir: string, destDir: string, key: string, written: string[], workspace: string = WORKSPACE): void {
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, rename(entry.name, key));
    if (entry.isDirectory()) {
      cloneModule(srcPath, destPath, key, written, workspace);
    } else {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.writeFileSync(destPath, rename(fs.readFileSync(srcPath, 'utf8'), key), 'utf8');
      written.push(path.relative(workspace, destPath).split(path.sep).join('/'));
    }
  }
}

// --- Generación en producción (Approach A) ---------------------------------
// En dev se escribe en el monorepo en disco. En prod (ALLOW_MODULE_GEN=1) se
// clona el repo DENTRO del contenedor, se genera ahí, y se hace commit + push:
// el webhook reconstruye prod con el módulo ya compilado. Cero archivos
// efímeros, todo queda versionado en git.
const { execFileSync } = require('node:child_process');

function genEnabled(): boolean {
  return env.nodeEnv !== 'production' || process.env.ALLOW_MODULE_GEN === '1';
}
function gitc(ws: string, args: string[]): void {
  execFileSync('git', ['-C', ws, ...args], { stdio: 'pipe' });
}
function prepareWorkspace(): {
  workspace: string;
  backendSrc: string;
  frontendSrc: string;
  prod: boolean;
} {
  if (env.nodeEnv !== 'production') {
    return { workspace: WORKSPACE, backendSrc: BACKEND_SRC, frontendSrc: FRONTEND_SRC, prod: false };
  }
  const ws = process.env.MODULE_WORKSPACE || '/app/gen-workspace';
  const repo = process.env.GIT_REPO_URL;
  if (!repo) throw new Error('Falta GIT_REPO_URL para generar módulos en producción.');
  if (!fs.existsSync(path.join(ws, '.git'))) {
    fs.mkdirSync(path.dirname(ws), { recursive: true });
    execFileSync('git', ['clone', '--depth', '1', repo, ws], { stdio: 'pipe' });
  } else {
    gitc(ws, ['remote', 'set-url', 'origin', repo]);
    gitc(ws, ['fetch', 'origin']);
    gitc(ws, ['reset', '--hard', 'origin/HEAD']);
  }
  gitc(ws, ['config', 'user.email', process.env.GIT_AUTHOR_EMAIL || 'panel@acmsy.com']);
  gitc(ws, ['config', 'user.name', process.env.GIT_AUTHOR_NAME || 'acmsy panel']);
  return {
    workspace: ws,
    backendSrc: path.join(ws, 'GestionProyectos-Backend', 'src'),
    frontendSrc: path.join(ws, 'GestionProyectos-Frontend', 'src'),
    prod: true
  };
}
function commitAndPush(ws: string, message: string): void {
  gitc(ws, ['add', '-A']);
  gitc(ws, ['commit', '-m', message]);
  gitc(ws, ['push', 'origin', 'HEAD:main']);
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
const publishSchema = Joi.object({
  projectId: Joi.number().integer().positive().required()
});

// Convierte un nombre arbitrario ("Vista 1", "Detalle del usuario") en
// PascalCase válido para usar como identificador en un nombre de archivo.
// Si el nombre queda vacío después de filtrar caracteres devuelve "".
function anyToPascal(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

interface ViewBlock {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  props: Record<string, unknown>;
}

interface ViewLayout {
  blocks?: ViewBlock[];
  frame?: { w?: number; h?: number };
}

const DEFAULT_FRAME_W_ABS = 1600;
const DEFAULT_FRAME_H_ABS = 900;

// Genera el .tsx de UNA vista publicada con SCALE-TO-FIT. La página
// medida en runtime su contenedor y aplica `transform: scale(...)`
// para que el canvas del diseño (designW x designH) entre ENTERO en
// el viewport, centrado, sin scroll. Cada bloque queda en su (x, y, w, h)
// absoluto idéntico al pizarrón.
//
// Resultado: pizarrón = preview = página publicada, exactos.
function viewFileContent(
  fileName: string,
  viewName: string,
  viewId: number,
  contentDesktop: string | null
): string {
  let layout: ViewLayout = { blocks: [] };
  try {
    if (contentDesktop) {
      const parsed = JSON.parse(contentDesktop) as ViewLayout;
      if (Array.isArray(parsed.blocks)) layout = parsed;
    }
  } catch {
    /* layout corrupto → página vacía */
  }

  const designW = layout.frame?.w ?? DEFAULT_FRAME_W_ABS;
  const designH = layout.frame?.h ?? DEFAULT_FRAME_H_ABS;
  const blocks = layout.blocks ?? [];
  const importLines = new Set<string>([
    `import { useEffect, useRef, useState } from 'react';`
  ]);
  const cellLines: string[] = [];
  const helperComponents: string[] = [];

  resetStateCounter();
  for (const b of blocks) {
    const result: SerializeResult = serializeBlock(b);
    for (const imp of result.imports) importLines.add(imp);
    if (result.helperComponent) helperComponents.push(result.helperComponent);
    const classAttr = result.wrapperClass
      ? ` className=${JSON.stringify(result.wrapperClass)}`
      : '';
    const leftPct = ((b.x / designW) * 100).toFixed(4);
    const widthPct = ((b.w / designW) * 100).toFixed(4);
    cellLines.push(
      `        <div${classAttr} key=${JSON.stringify(b.id)} style={{ position: 'absolute' as const, left: \`${leftPct}%\`, top: ${b.y} * sy, width: \`${widthPct}%\`, height: ${b.h} * sy }}>${result.jsx}</div>`
    );
  }

  const importsBlock = Array.from(importLines).sort().join('\n');
  return [
    `// Auto-generado a partir de la vista "${viewName.replace(/\*\//g, '*\\/')}" (id=${viewId}).`,
    `// Se sobrescribe al volver a publicar — no editar a mano.`,
    ``,
    importsBlock,
    ``,
    `const DESIGN_W = ${designW};`,
    `const DESIGN_H = ${designH};`,
    ``,
    ...(helperComponents.length > 0 ? [...helperComponents, ''] : []),
    `export default function ${fileName}() {`,
    `  // Ancho con porcentajes en cada bloque; alto con \`sy\` (nunca`,
    `  // agranda, solo achica si viewport_h < DESIGN_H). Sin transform`,
    `  // porque rompe el dropdown de los Select, los Portals y hovers.`,
    `  const ref = useRef<HTMLDivElement>(null);`,
    `  const [sy, setSy] = useState(1);`,
    `  useEffect(() => {`,
    `    const el = ref.current;`,
    `    if (!el) return;`,
    `    const update = (): void => {`,
    `      const r = el.getBoundingClientRect();`,
    `      if (r.height === 0) return;`,
    `      setSy(r.height >= DESIGN_H ? 1 : r.height / DESIGN_H);`,
    `    };`,
    `    update();`,
    `    const obs = new ResizeObserver(update);`,
    `    obs.observe(el);`,
    `    return () => obs.disconnect();`,
    `  }, []);`,
    `  return (`,
    `    <div ref={ref} className="relative h-full w-full overflow-hidden">`,
    `      <div style={{ position: 'relative', width: '100%', height: DESIGN_H * sy }}>`,
    ...(cellLines.length > 0 ? cellLines : [`        {/* sin componentes */}`]),
    `      </div>`,
    `    </div>`,
    `  );`,
    `}`,
    ``
  ].join('\n');
}

// Punto de entrada del submódulo: simplemente renderea la vista
// marcada como primaryViewId en el design (la "principal"). Mientras no
// haya navegación entre vistas, esto es lo que el usuario ve al entrar.
function listPageContent(modulePascal: string, primaryComponent: string): string {
  return [
    `// Auto-generado — entry point del submódulo. Muestra la vista`,
    `// principal del diseño. Se sobrescribe al volver a publicar.`,
    ``,
    `import ${primaryComponent} from './${primaryComponent}.js';`,
    ``,
    `export default function ${modulePascal}ListPage() {`,
    `  return <${primaryComponent} />;`,
    `}`,
    ``
  ].join('\n');
}

module.exports = (db: Knex) => {
  const designRepository = new DesignRepositoryImpl(db);
  const getProject = getProjectUC({ designRepository });
  const router = Router();

  router.post('/submodule', authMiddleware, validate(schema), (req, res, next) => {
    if (!genEnabled()) {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'El generador de módulos está deshabilitado.'
      });
      return;
    }
    try {
      const { workspace, backendSrc, frontendSrc, prod } = prepareWorkspace();
      const name: string = req.body.name.trim();
      const key = toKey(name);
      if (!key || key === TEMPLATE) {
        res.status(400).json({ error: 'BAD_REQUEST', message: 'Nombre inválido.' });
        return;
      }

      const beModuleDir = path.join(backendSrc, 'modules', key);
      const feModuleDir = path.join(frontendSrc, 'modules', key);
      if (fs.existsSync(beModuleDir) || fs.existsSync(feModuleDir)) {
        res.status(409).json({ error: 'CONFLICT', message: `Ya existe un módulo "${key}".` });
        return;
      }

      const beTemplate = path.join(backendSrc, 'modules', TEMPLATE);
      const feTemplate = path.join(frontendSrc, 'modules', TEMPLATE);
      if (!fs.existsSync(beTemplate) || !fs.existsSync(feTemplate)) {
        res.status(500).json({
          error: 'NO_TEMPLATE',
          message: 'No se encontró el módulo de referencia module-x.'
        });
        return;
      }

      const written: string[] = [];
      cloneModule(beTemplate, beModuleDir, key, written, workspace);
      cloneModule(feTemplate, feModuleDir, key, written, workspace);

      // Migración + seed (module-x usa su propia tabla; el clon necesita la suya).
      const migNum = nextNumber(path.join(backendSrc, 'database', 'migrations'));
      const migPath = path.join(backendSrc, 'database', 'migrations', `${migNum}_create_${key}.ts`);
      fs.writeFileSync(migPath, migrationContent(key), 'utf8');
      written.push(path.relative(workspace, migPath).split(path.sep).join('/'));

      const seedNum = nextNumber(path.join(backendSrc, 'database', 'seeds'));
      const seedPath = path.join(backendSrc, 'database', 'seeds', `${seedNum}_${key}.seed.ts`);
      fs.writeFileSync(seedPath, seedContent(name), 'utf8');
      written.push(path.relative(workspace, seedPath).split(path.sep).join('/'));

      // En prod: commit + push -> el webhook reconstruye prod con el módulo ya
      // compilado y la migración corre al arrancar el contenedor.
      if (prod) commitAndPush(workspace, `feat(${key}): modulo generado desde el panel`);

      res.status(201).json({
        key,
        name: toPascal(key),
        count: written.length,
        files: written.sort(),
        deployed: prod
      });
    } catch (e) {
      next(e);
    }
  });

  // Publica el diseño visual como páginas .tsx reales del submódulo.
  // Por cada vista escribe `<Key><ViewName>Page.tsx` con el JSON del
  // layout embebido; sobrescribe `<Key>ListPage.tsx` para que apunte a
  // la vista marcada como principal en el design.
  router.post(
    '/publish-design',
    authMiddleware,
    validate(publishSchema),
    async (req, res, next) => {
      if (env.nodeEnv === 'production') {
        res.status(403).json({
          error: 'FORBIDDEN',
          message: 'La publicación solo está disponible en desarrollo.'
        });
        return;
      }
      try {
        const projectId = Number(req.body.projectId);
        const project = await getProject(projectId);
        if (!project) {
          res.status(404).json({ error: 'NOT_FOUND', message: 'Proyecto no encontrado.' });
          return;
        }

        const key = toKey(project.name);
        if (!key || key === TEMPLATE) {
          res.status(400).json({
            error: 'INVALID_NAME',
            message: 'El nombre del proyecto no es válido para un submódulo.'
          });
          return;
        }

        const moduleDir = path.join(FRONTEND_SRC, 'modules', key);
        if (!fs.existsSync(moduleDir)) {
          res.status(409).json({
            error: 'MODULE_NOT_FOUND',
            message: `No existe el módulo "${key}" en disco. Creá el submódulo primero.`
          });
          return;
        }

        const views = project.views ?? [];
        if (views.length === 0) {
          res.status(400).json({
            error: 'NO_VIEWS',
            message: 'El diseño no tiene vistas para publicar.'
          });
          return;
        }

        const modulePascal = toPascal(key);
        const pagesDir = path.join(moduleDir, 'ui', 'pages');
        fs.mkdirSync(pagesDir, { recursive: true });

        // Si no hay primaryViewId la primera por posición es la principal.
        const sortedViews = [...views].sort((a, b) => a.position - b.position);
        const primary =
          sortedViews.find((v) => v.id === project.primaryViewId) ?? sortedViews[0]!;

        const written: string[] = [];
        // Trackeo nombres ya usados — si dos vistas se llaman igual
        // (o sus PascalCase colapsan) sufijo con su id para no pisar.
        const used = new Set<string>();
        let primaryComponent: string | null = null;

        for (const view of sortedViews) {
          let pascal = anyToPascal(view.name);
          if (!pascal) pascal = `Vista${view.position + 1}`;
          let component = `${modulePascal}${pascal}Page`;
          if (used.has(component)) component = `${component}${view.id}`;
          used.add(component);

          const filePath = path.join(pagesDir, `${component}.tsx`);
          fs.writeFileSync(
            filePath,
            viewFileContent(component, view.name, view.id, view.contentDesktop),
            'utf8'
          );
          written.push(path.relative(WORKSPACE, filePath).split(path.sep).join('/'));

          if (view.id === primary.id) primaryComponent = component;
        }

        // Sobrescribe el entry point del submódulo (ListPage del clon)
        // para que renderee la vista principal.
        if (primaryComponent) {
          const listPath = path.join(pagesDir, `${modulePascal}ListPage.tsx`);
          fs.writeFileSync(
            listPath,
            listPageContent(modulePascal, primaryComponent),
            'utf8'
          );
          written.push(path.relative(WORKSPACE, listPath).split(path.sep).join('/'));
        }

        res.json({
          key,
          primaryViewId: primary.id,
          files: written.sort()
        });
      } catch (e) {
        next(e);
      }
    }
  );

  return router;
};
