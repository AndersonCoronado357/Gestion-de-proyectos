import { Router } from 'express';
import type { Knex } from 'knex';
import { buildGoogleTokenRepository } from '../../../_shared/adapters/exit/google-token.repository.impl';
import { resolveAccessTokenUseCase } from '../../../_shared/use-cases/resolveAccessToken';
import { buildGmailHttpClient } from '../exit/gmail.http.client';

const authMiddleware = require('../../../../../shared/middlewares/auth.middleware');
const buildController = require('./gmail.controller');

module.exports = (db: Knex) => {
  const repo = buildGoogleTokenRepository(db);
  const resolveAccessToken = resolveAccessTokenUseCase({ repo });
  const gmail = buildGmailHttpClient({ resolveAccessToken });
  const controller = buildController({ gmail });
  const router = Router();

  router.get('/labels', authMiddleware, controller.listLabels);
  router.get('/messages', authMiddleware, controller.listMessages);
  router.get('/messages/:id', authMiddleware, controller.getMessage);
  router.post('/messages', authMiddleware, controller.sendMessage);
  router.post('/messages/:id/trash', authMiddleware, controller.trashMessage);
  router.post('/messages/:id/read', authMiddleware, controller.markRead);

  return router;
};
