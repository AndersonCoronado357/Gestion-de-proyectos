// Contenido editable del panel del login (mensajes: título + texto).
//
//   GET  /api/login-content   PÚBLICO  → lo lee la pantalla de login.
//   PUT  /api/login-content   protegido → lo edita el admin.
//
// Se guarda en la BASE DE DATOS (tabla `login_messages`, una fila por mensaje
// con su `position`). Si la tabla todavía no existe (migración pendiente), el
// GET devuelve los defaults para no romper el login.

import type { Knex } from 'knex';
import { Router } from 'express';
import Joi from 'joi';

const authMiddleware = require('../../shared/middlewares/auth.middleware');
const validate = require('../../shared/middlewares/validate.middleware');

interface Slide {
  title: string;
  text: string;
  bg: number;
}

const DEFAULT_SLIDES: Slide[] = [
  {
    title: 'Todos tus proyectos, en un solo lugar.',
    text: 'Centraliza cada iniciativa con su responsable, centro y área, y velas avanzar en tiempo real.',
    bg: 0
  },
  {
    title: 'El avance, siempre al día.',
    text: 'Registra el estado y el porcentaje de cada proyecto, y conserva la historia de su evolución.',
    bg: 1
  },
  {
    title: 'Que nada se quede pendiente.',
    text: 'Organiza las tareas por responsable y ten siempre claro qué falta por hacer.',
    bg: 2
  },
  {
    title: 'Mide lo que de verdad importa.',
    text: 'Costo, ahorro anual y porcentaje de avance de cada iniciativa, de un vistazo.',
    bg: 3
  }
];

const schema = Joi.object({
  slides: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().trim().min(1).max(200).required(),
        text: Joi.string().trim().allow('').max(500).required(),
        bg: Joi.number().integer().min(0).max(50).default(0)
      })
    )
    .min(1)
    .max(12)
    .required()
});

async function readSlides(db: Knex): Promise<Slide[]> {
  // select('*') para no romper si la columna bg_variant aún no existe.
  const rows = await db('login_messages').orderBy('position', 'asc').select('*');
  return rows.map(
    (r: { title: string; body: string | null; bg_variant?: number | null }) => ({
      title: r.title,
      text: r.body ?? '',
      bg: r.bg_variant ?? 0
    })
  );
}

module.exports = (db: Knex) => {
  const router = Router();

  // PÚBLICO: el login (no autenticado) lo necesita para pintar el panel.
  router.get('/', async (_req, res) => {
    try {
      const slides = await readSlides(db);
      res.json({ slides: slides.length > 0 ? slides : DEFAULT_SLIDES });
    } catch {
      // Tabla inexistente (migración pendiente) → defaults.
      res.json({ slides: DEFAULT_SLIDES });
    }
  });

  // Protegido: reemplaza todos los mensajes (el editor manda la lista completa).
  router.put('/', authMiddleware, validate(schema), async (req, res, next) => {
    const slides: Slide[] = req.body.slides;
    try {
      const hasBg = await db.schema.hasColumn('login_messages', 'bg_variant');
      await db.transaction(async (trx) => {
        await trx('login_messages').del();
        await trx('login_messages').insert(
          slides.map((s, i) => ({
            title: s.title,
            body: s.text,
            position: i,
            ...(hasBg ? { bg_variant: s.bg ?? 0 } : {})
          }))
        );
      });
      res.json({ slides: await readSlides(db) });
    } catch (e) {
      next(e);
    }
  });

  return router;
};
