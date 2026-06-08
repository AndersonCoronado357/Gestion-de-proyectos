import { Router } from 'express';
import type { Knex } from 'knex';
import { buildGoogleTokenRepository } from '../../../_shared/adapters/exit/google-token.repository.impl';
import { resolveAccessTokenUseCase } from '../../../_shared/use-cases/resolveAccessToken';
import { buildDocsHttpClient } from '../exit/docs.http.client';

const authMiddleware = require('../../../../../shared/middlewares/auth.middleware');
const buildController = require('./docs.controller');

module.exports = (db: Knex) => {
  const repo = buildGoogleTokenRepository(db);
  const resolveAccessToken = resolveAccessTokenUseCase({ repo });
  const docs = buildDocsHttpClient({ resolveAccessToken });
  const controller = buildController({ docs });
  const router = Router();

  router.get('/documents', authMiddleware, controller.listDocs);
  router.get('/documents/:id', authMiddleware, controller.getDoc);
  router.post('/documents', authMiddleware, controller.createDoc);
  router.patch('/documents/:id', authMiddleware, controller.renameDoc);
  router.delete('/documents/:id', authMiddleware, controller.deleteDoc);
  router.put('/documents/:id/content', authMiddleware, controller.replaceContent);
  router.post('/documents/:id/append', authMiddleware, controller.appendText);

  return router;
};
