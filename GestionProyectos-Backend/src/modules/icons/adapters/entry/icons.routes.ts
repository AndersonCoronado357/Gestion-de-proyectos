// Routes del módulo "icons" — biblioteca de SVG.
//
//   GET    /api/icons             listado + búsqueda (auth)
//   POST   /api/icons             subir un SVG nuevo (idempotente por hash)
//   PATCH  /api/icons/:id         renombrar
//   DELETE /api/icons/:id         borrar (409 si está en uso)

import type { Knex } from 'knex';
import { Router } from 'express';
import Joi from 'joi';

const validate = require('../../../../shared/middlewares/validate.middleware');
const authMiddleware = require('../../../../shared/middlewares/auth.middleware');
const IconRepositoryImpl = require('../exit/icon.repository.impl');
const buildController = require('./icons.controller');
const listIconsUC = require('../../use-cases/listIcons');
const createIconUC = require('../../use-cases/createIcon');
const renameIconUC = require('../../use-cases/renameIcon');
const updateIconSvgUC = require('../../use-cases/updateIconSvg');
const deleteIconUC = require('../../use-cases/deleteIcon');

const createSchema = Joi.object({
  name: Joi.string().allow('', null).max(120).optional(),
  displayName: Joi.string().allow('', null).max(200).optional(),
  svg: Joi.string().min(8).max(50_000).required()
});
const patchSchema = Joi.object({
  displayName: Joi.string().allow('', null).max(200).optional(),
  svg: Joi.string().min(8).max(50_000).optional()
}).min(1);

module.exports = (db: Knex) => {
  const iconRepository = new IconRepositoryImpl(db);
  const useCases = {
    listIcons: listIconsUC({ iconRepository }),
    createIcon: createIconUC({ iconRepository }),
    renameIcon: renameIconUC({ iconRepository }),
    updateIconSvg: updateIconSvgUC({ iconRepository }),
    deleteIcon: deleteIconUC({ iconRepository })
  };
  const controller = buildController({ useCases });
  const router = Router();

  router.get('/', authMiddleware, controller.list);
  router.post('/', authMiddleware, validate(createSchema), controller.create);
  router.patch('/:id', authMiddleware, validate(patchSchema), controller.patch);
  router.delete('/:id', authMiddleware, controller.delete);

  return router;
};
