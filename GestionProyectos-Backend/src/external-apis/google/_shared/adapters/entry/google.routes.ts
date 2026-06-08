// Rutas del shared de Google — connect/status/disconnect.
//
// Wireup:
//   app.use('/api/external-apis/google', buildGoogleSharedRoutes(db));

import { Router } from 'express';
import type { Knex } from 'knex';
import { buildGoogleTokenRepository } from '../exit/google-token.repository.impl';
import { connectAccountUseCase } from '../../use-cases/connectAccount';
import { disconnectAccountUseCase } from '../../use-cases/disconnectAccount';
import { getStatusUseCase } from '../../use-cases/getStatus';

const authMiddleware = require('../../../../../shared/middlewares/auth.middleware');
const buildController = require('./google.controller');

module.exports = (db: Knex) => {
  const repo = buildGoogleTokenRepository(db);
  const useCases = {
    connect: connectAccountUseCase({ repo }),
    disconnect: disconnectAccountUseCase({ repo }),
    getStatus: getStatusUseCase({ repo })
  };
  const controller = buildController({ useCases });
  const router = Router();
  router.get('/status', authMiddleware, controller.status);
  router.post('/connect', authMiddleware, controller.connect);
  router.post('/disconnect', authMiddleware, controller.disconnect);
  return router;
};
