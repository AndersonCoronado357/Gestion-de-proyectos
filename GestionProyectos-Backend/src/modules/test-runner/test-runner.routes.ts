// Corredor de tests (SOLO DESARROLLO).
//
// Ejecuta la suite de Jest del backend y devuelve los resultados como JSON
// para el panel de Tests. Jest auto-descubre TODOS los *.test.ts, así que
// cualquier test nuevo aparece sin tocar nada acá.
//   - POST /list : lista los archivos de test (sin correrlos) para elegir.
//   - POST /run  : corre todos, o sólo los { paths } seleccionados.
// El navegador no puede correr Jest → lo corre el backend (proceso hijo).
// Bloqueado en producción.

import type { Knex } from 'knex';
import { Router } from 'express';
import path from 'node:path';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import Joi from 'joi';

const authMiddleware = require('../../shared/middlewares/auth.middleware');
const validate = require('../../shared/middlewares/validate.middleware');
const env = require('../../config/env');

const BACKEND_ROOT = path.resolve(__dirname, '../../..'); // .../GestionProyectos-Backend
const JEST_BIN = path.join(BACKEND_ROOT, 'node_modules', 'jest', 'bin', 'jest.js');

interface RawAssertion {
  title: string;
  fullName: string;
  status: string;
  duration?: number | null;
  failureMessages?: string[];
}
interface RawSuite {
  name: string;
  status: string;
  assertionResults: RawAssertion[];
}
interface RawReport {
  numTotalTests: number;
  numPassedTests: number;
  numFailedTests: number;
  numPendingTests: number;
  numTodoTests: number;
  numTotalTestSuites: number;
  testResults: RawSuite[];
}

const rel = (abs: string): string =>
  path.relative(BACKEND_ROOT, abs).split(path.sep).join('/');

function moduleOf(file: string): string {
  const norm = file.split(path.sep).join('/');
  const m = /modules\/([^/]+)\//.exec(norm);
  return m ? m[1] : (norm.split('/').pop() ?? norm);
}

// Lista los archivos de test recorriendo el FS (rápido, sin arrancar Jest).
function listTestFiles(): string[] {
  const root = path.join(BACKEND_ROOT, 'src');
  const out: string[] = [];
  const walk = (dir: string): void => {
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name !== 'node_modules') walk(full);
      } else if (/\.(test|spec)\.tsx?$/.test(e.name)) {
        out.push(full);
      }
    }
  };
  walk(root);
  return out;
}

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Regex de jest --testPathPattern que matchea los archivos elegidos, con
// separador agnóstico (Windows `\` o POSIX `/`).
function buildPattern(paths: string[]): string {
  const sep = '[\\\\/]';
  const parts = paths.map((p) =>
    p
      .split(/[\\/]/)
      .filter(Boolean)
      .map(escapeRe)
      .join(sep)
  );
  return `(${parts.join('|')})`;
}

function spawnJest(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [JEST_BIN, ...args], { cwd: BACKEND_ROOT });
    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error('Jest excedió el tiempo límite (120 s).'));
    }, 120000);
    child.stdout.on('data', (d) => (out += d.toString()));
    child.stderr.on('data', (d) => (err += d.toString()));
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(e);
    });
    child.on('close', () => {
      clearTimeout(timer);
      if (!out.includes('{') && !out.includes('[')) {
        reject(new Error('Jest no devolvió JSON.\n' + err.slice(-2000)));
        return;
      }
      resolve(out);
    });
  });
}

function extractJson(out: string, open: '{' | '['): string {
  const i = out.indexOf(open);
  if (i === -1) throw new Error('No se encontró JSON en la salida de Jest.');
  return out.slice(i);
}

function mapReport(report: RawReport) {
  const suites = report.testResults.map((s) => ({
    file: rel(s.name),
    module: moduleOf(s.name),
    status: s.status,
    tests: s.assertionResults.map((t) => ({
      title: t.fullName || t.title,
      status: t.status,
      duration: t.duration ?? null,
      messages: t.failureMessages ?? []
    }))
  }));
  return {
    summary: {
      total: report.numTotalTests,
      passed: report.numPassedTests,
      failed: report.numFailedTests,
      pending: (report.numPendingTests ?? 0) + (report.numTodoTests ?? 0),
      suites: report.numTotalTestSuites
    },
    suites
  };
}

const runSchema = Joi.object({
  paths: Joi.array().items(Joi.string()).optional()
});

module.exports = (_db: Knex) => {
  const router = Router();

  const devOnly = (res: import('express').Response): boolean => {
    if (env.nodeEnv === 'production') {
      res.status(403).json({
        error: 'FORBIDDEN',
        message: 'El corredor de tests solo está disponible en desarrollo.'
      });
      return true;
    }
    return false;
  };

  // Lista los archivos de test (sin correrlos) recorriendo el FS — rápido.
  router.post('/list', authMiddleware, (_req, res) => {
    if (devOnly(res)) return;
    const files = listTestFiles()
      .map((p) => {
        const r = rel(p);
        return { path: r, module: moduleOf(r), name: r.split('/').pop() ?? r };
      })
      .sort(
        (a, b) => a.module.localeCompare(b.module) || a.name.localeCompare(b.name)
      );
    res.json({ files });
  });

  // Corre toda la suite, o sólo los archivos { paths } seleccionados.
  router.post('/run', authMiddleware, validate(runSchema), async (req, res, next) => {
    if (devOnly(res)) return;
    try {
      const paths: string[] = Array.isArray(req.body?.paths)
        ? req.body.paths.filter((p: unknown) => typeof p === 'string' && p.trim())
        : [];
      const args = ['--json', '--ci'];
      if (paths.length > 0) args.push('--testPathPattern', buildPattern(paths));
      const out = await spawnJest(args);
      const report = JSON.parse(extractJson(out, '{')) as RawReport;
      res.json(mapReport(report));
    } catch (e) {
      next(e);
    }
  });

  return router;
};
