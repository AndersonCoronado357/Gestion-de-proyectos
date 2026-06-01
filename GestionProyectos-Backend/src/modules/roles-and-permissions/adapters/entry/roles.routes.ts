// Routes del módulo Roles & Permisos.
//
//   GET    /api/roles      protegido — lista con permissions + cargos.
//   POST   /api/roles      protegido — crea.
//   PUT    /api/roles/:id  protegido — actualiza (parcial).
//   DELETE /api/roles/:id  protegido — soft-delete.

import type { Knex } from 'knex';
import { Router } from 'express';
import Joi from 'joi';

const authMiddleware = require('../../../../shared/middlewares/auth.middleware');
const validate = require('../../../../shared/middlewares/validate.middleware');
const RolesRepositoryImpl = require('../exit/roles.repository.impl');
const buildController = require('./roles.controller');
const listUC = require('../../use-cases/listRoles');
const createUC = require('../../use-cases/createRole');
const updateUC = require('../../use-cases/updateRole');
const deleteUC = require('../../use-cases/deleteRole');

// Mapa permissions = { '<submoduleId>': { view?, create?, edit?, delete? } }
//
// OJO: NO ponemos `.default({})` en estos schemas.  Si lo hacemos, Joi
// rellena el campo cuando el cliente no lo manda y el use-case ve
// `permissions: {}` en lugar de `undefined` → el repo cree que el cliente
// pidió vaciar los permisos y dispara `replacePermissionsTx(trx, id, {})`,
// borrando todo.  El bug se manifestaba al renombrar un rol: el front
// mandaba `{ name }` solamente y los permisos desaparecían en silencio.
//
// Para CREATE damos defaults dentro del schema raíz (sólo cuando el field
// entero falta), porque ahí sí queremos que un rol nuevo arranque limpio
// con `{}` / `[]`.
const submoduleActionsSchema = Joi.object({
  view: Joi.boolean().optional(),
  create: Joi.boolean().optional(),
  edit: Joi.boolean().optional(),
  delete: Joi.boolean().optional()
});

const permissionsSchema = Joi.object().pattern(/^.+$/, submoduleActionsSchema);

const cargosSchema = Joi.array().items(Joi.string().min(1).max(100));

const createRoleSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  description: Joi.string().allow('', null).max(255).optional(),
  permissions: permissionsSchema.default({}),
  cargos: cargosSchema.default([])
});

// En UPDATE los campos quedan TRUE opcionales: si no vienen en el body,
// no aparecen en `req.body` y el repo respeta el estado existente.
const updateRoleSchema = Joi.object({
  name: Joi.string().min(1).max(100).optional(),
  description: Joi.string().allow('', null).max(255).optional(),
  permissions: permissionsSchema.optional(),
  cargos: cargosSchema.optional()
});

module.exports = (db: Knex) => {
  const rolesRepository = new RolesRepositoryImpl(db);
  const useCases = {
    list: listUC({ rolesRepository }),
    create: createUC({ rolesRepository }),
    update: updateUC({ rolesRepository }),
    delete: deleteUC({ rolesRepository })
  };
  const controller = buildController({ useCases });
  const router = Router();

  router.get('/', authMiddleware, controller.list);
  router.post('/', authMiddleware, validate(createRoleSchema), controller.create);
  router.put('/:id', authMiddleware, validate(updateRoleSchema), controller.update);
  router.delete('/:id', authMiddleware, controller.delete);

  return router;
};
