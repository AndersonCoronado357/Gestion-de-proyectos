// Routes del módulo Users.
//
//   GET /api/users           protegido (requiere access token)
//   PUT /api/users/:id/roles protegido — reemplazo atómico de roles

import type { Knex } from 'knex';
import { Router } from 'express';
import Joi from 'joi';

const authMiddleware = require('../../../../shared/middlewares/auth.middleware');
const validate = require('../../../../shared/middlewares/validate.middleware');
const UsersRepositoryImpl = require('../exit/users.repository.impl');
const buildController = require('./users.controller');
const listUC = require('../../use-cases/listUsers');
const replaceUserRolesUC = require('../../use-cases/replaceUserRoles');

const rolesSchema = Joi.object({
  roles: Joi.array().items(Joi.string().min(1).max(100)).required()
});

module.exports = (db: Knex) => {
  const usersRepository = new UsersRepositoryImpl(db);
  const useCases = {
    list: listUC({ usersRepository }),
    replaceRoles: replaceUserRolesUC({ usersRepository })
  };
  const controller = buildController({ useCases });
  const router = Router();

  router.get('/', authMiddleware, controller.list);
  router.put(
    '/:id/roles',
    authMiddleware,
    validate(rolesSchema),
    controller.replaceRoles
  );

  return router;
};
