// Routes del módulo Services (catálogo de cargos).
//
//   GET /api/services   protegido — lista del catálogo.

import type { Knex } from 'knex';
import { Router } from 'express';

const authMiddleware = require('../../../../shared/middlewares/auth.middleware');
const ServicesRepositoryImpl = require('../exit/services.repository.impl');
const buildController = require('./services.controller');
const listUC = require('../../use-cases/listServices');

module.exports = (db: Knex) => {
  const servicesRepository = new ServicesRepositoryImpl(db);
  const useCases = {
    list: listUC({ servicesRepository })
  };
  const controller = buildController({ useCases });
  const router = Router();

  router.get('/', authMiddleware, controller.list);

  return router;
};
