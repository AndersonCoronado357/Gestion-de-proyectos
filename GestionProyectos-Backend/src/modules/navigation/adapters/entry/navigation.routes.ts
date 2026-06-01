// Rutas del módulo navigation.
//
//   GET /api/navigation/tree   protegido — el front lo lee para pintar
//                              el sidebar y resolver rutas.
//   PUT /api/navigation/tree   protegido — el builder lo usa para
//                              guardar los cambios.

import type { Knex } from 'knex';
import { Router } from 'express';
import Joi from 'joi';

const validate = require('../../../../shared/middlewares/validate.middleware');
const authMiddleware = require('../../../../shared/middlewares/auth.middleware');
const NavigationRepositoryImpl = require('../exit/navigation.repository.impl');
const buildController = require('./navigation.controller');
const getTreeUC = require('../../use-cases/getTree');
const saveTreeUC = require('../../use-cases/saveTree');

const submoduleSchema = Joi.object({
  id: Joi.number().integer().positive().allow(null),
  // clientId — opcional, sólo lo manda el front para items nuevos.
  clientId: Joi.string().max(64).allow('', null),
  name: Joi.string().min(1).max(100).required(),
  icon: Joi.string().allow('', null),
  path: Joi.string().max(255).allow('', null),
  folderKey: Joi.string().max(100).allow('', null)
});

const moduleSchema = Joi.object({
  id: Joi.number().integer().positive().allow(null),
  clientId: Joi.string().max(64).allow('', null),
  name: Joi.string().min(1).max(100).required(),
  icon: Joi.string().allow('', null),
  submodules: Joi.array().items(submoduleSchema).default([])
});

const saveTreeSchema = Joi.object({
  tree: Joi.array().items(moduleSchema).required()
});

module.exports = (db: Knex) => {
  const navigationRepository = new NavigationRepositoryImpl(db);
  const useCases = {
    getTree: getTreeUC({ navigationRepository }),
    saveTree: saveTreeUC({ navigationRepository })
  };
  const controller = buildController({ useCases });
  const router = Router();

  router.get('/tree', authMiddleware, controller.getTree);
  router.put('/tree', authMiddleware, validate(saveTreeSchema), controller.saveTree);

  // Biblioteca de iconos: los SVG con nombre que viven en la tabla `icons`.
  // PÚBLICO (sin auth) a propósito: la pantalla de login y el primer paint
  // necesitan los iconos antes de autenticarse, y un SVG no es sensible.
  router.get('/icons', async (_req, res, next) => {
    try {
      if (!(await db.schema.hasTable('icons'))) {
        res.json({ icons: [] });
        return;
      }
      const icons = await db('icons')
        .whereNotNull('name')
        .select('id', 'name', 'svg')
        .orderBy('name');
      res.json({ icons });
    } catch (e) {
      next(e);
    }
  });

  return router;
};
