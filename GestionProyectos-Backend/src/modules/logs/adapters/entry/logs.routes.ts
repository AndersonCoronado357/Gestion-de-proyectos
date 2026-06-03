// Routes del módulo "logs".
//
//   POST /api/logs                  ingesta batch (auth opcional)
//   GET  /api/logs                  listado con filtros (protegido)
//   GET  /api/logs/summary          KPIs (protegido)
//   GET  /api/logs/:id              detalle + relacionados (protegido)

import type { Knex } from 'knex';
import { Router } from 'express';
import Joi from 'joi';

const validate = require('../../../../shared/middlewares/validate.middleware');
const authMiddleware = require('../../../../shared/middlewares/auth.middleware');
const LogRepositoryImpl = require('../exit/log.repository.impl');
const buildController = require('./logs.controller');
const ingestLogsUC = require('../../use-cases/ingestLogs');
const listLogsUC = require('../../use-cases/listLogs');
const getLogDetailUC = require('../../use-cases/getLogDetail');
const getSummaryUC = require('../../use-cases/getSummary');

// Aceptamos cualquier estructura razonable y dejamos que el use case sanitice
// fuerte (es un endpoint de captura — preferimos no devolver 400 por una
// entrada malformada, mejor descartarla y seguir).
const ingestSchema = Joi.object({
  entries: Joi.array().items(Joi.object().unknown(true)).max(500).required()
});

module.exports = (db: Knex) => {
  const logRepository = new LogRepositoryImpl(db);
  const useCases = {
    ingestLogs: ingestLogsUC({ logRepository }),
    listLogs: listLogsUC({ logRepository }),
    getLogDetail: getLogDetailUC({ logRepository }),
    getSummary: getSummaryUC({ logRepository })
  };
  const controller = buildController({ useCases });
  const router = Router();

  // Ingesta SIN authMiddleware para que el frontend pueda reportar errores
  // que ocurran fuera de sesión (login fallido, errores cargando el shell).
  // El controller lee req.user si está disponible.
  router.post('/', validate(ingestSchema), controller.ingest);

  router.get('/', authMiddleware, controller.list);
  router.get('/summary', authMiddleware, controller.summary);
  router.get('/:id', authMiddleware, controller.detail);

  return router;
};
