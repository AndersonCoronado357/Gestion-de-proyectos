// Routes del módulo "design" — constructor visual de páginas.
//
//   GET    /api/design/projects                 lista de proyectos
//   POST   /api/design/projects                 crea proyecto (auto-crea Vista 1)
//   GET    /api/design/projects/:id             detalle + vistas
//   PATCH  /api/design/projects/:id             rename / set primaryViewId
//   DELETE /api/design/projects/:id             borra cascade
//   POST   /api/design/projects/:id/views       crea vista
//   PATCH  /api/design/projects/:id/views/:viewId  guarda layout / rename
//   DELETE /api/design/projects/:id/views/:viewId  borra vista

import type { Knex } from 'knex';
import { Router } from 'express';
import Joi from 'joi';

const validate = require('../../../../shared/middlewares/validate.middleware');
const authMiddleware = require('../../../../shared/middlewares/auth.middleware');
const DesignRepositoryImpl = require('../exit/design.repository.impl');
const buildController = require('./design.controller');
const listProjectsUC = require('../../use-cases/listProjects');
const getProjectUC = require('../../use-cases/getProject');
const createProjectUC = require('../../use-cases/createProject');
const findOrCreateProjectByNameUC = require('../../use-cases/findOrCreateProjectByName');
const updateProjectUC = require('../../use-cases/updateProject');
const deleteProjectUC = require('../../use-cases/deleteProject');
const createViewUC = require('../../use-cases/createView');
const updateViewUC = require('../../use-cases/updateView');
const deleteViewUC = require('../../use-cases/deleteView');

const projectCreateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).required()
});

const projectPatchSchema = Joi.object({
  name: Joi.string().trim().min(1).max(200).optional(),
  primaryViewId: Joi.number().integer().positive().allow(null).optional()
}).min(1);

const viewCreateSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).optional()
});

const viewPatchSchema = Joi.object({
  name: Joi.string().trim().min(1).max(120).optional(),
  position: Joi.number().integer().min(0).optional(),
  // Hasta 2 MB por layout — suficiente para diseños complejos.
  contentDesktop: Joi.string().allow(null).max(2_000_000).optional(),
  contentMobile: Joi.string().allow(null).max(2_000_000).optional()
}).min(1);

module.exports = (db: Knex) => {
  const designRepository = new DesignRepositoryImpl(db);
  const useCases = {
    listProjects: listProjectsUC({ designRepository }),
    getProject: getProjectUC({ designRepository }),
    createProject: createProjectUC({ designRepository }),
    findOrCreateProjectByName: findOrCreateProjectByNameUC({ designRepository }),
    updateProject: updateProjectUC({ designRepository }),
    deleteProject: deleteProjectUC({ designRepository }),
    createView: createViewUC({ designRepository }),
    updateView: updateViewUC({ designRepository }),
    deleteView: deleteViewUC({ designRepository })
  };
  const controller = buildController({ useCases });
  const router = Router();

  router.get('/projects', authMiddleware, controller.list);
  router.post(
    '/projects',
    authMiddleware,
    validate(projectCreateSchema),
    controller.create
  );
  // Upsert por nombre — usado por el Hub "Crear submódulo".
  router.post(
    '/by-submodule',
    authMiddleware,
    validate(projectCreateSchema),
    controller.findOrCreateByName
  );
  router.get('/projects/:id', authMiddleware, controller.get);
  router.patch(
    '/projects/:id',
    authMiddleware,
    validate(projectPatchSchema),
    controller.patch
  );
  router.delete('/projects/:id', authMiddleware, controller.delete);

  router.post(
    '/projects/:id/views',
    authMiddleware,
    validate(viewCreateSchema),
    controller.createView
  );
  router.patch(
    '/projects/:id/views/:viewId',
    authMiddleware,
    validate(viewPatchSchema),
    controller.patchView
  );
  router.delete('/projects/:id/views/:viewId', authMiddleware, controller.deleteView);

  return router;
};
