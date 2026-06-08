// Rutas del tester de Google Drive.
// Wireup: app.use('/api/external-apis/google/drive', buildDriveRoutes(db))

import { Router } from 'express';
import type { Knex } from 'knex';
import { buildGoogleTokenRepository } from '../../../_shared/adapters/exit/google-token.repository.impl';
import { resolveAccessTokenUseCase } from '../../../_shared/use-cases/resolveAccessToken';
import { buildDriveHttpClient } from '../exit/drive.http.client';

const authMiddleware = require('../../../../../shared/middlewares/auth.middleware');
const buildController = require('./drive.controller');

module.exports = (db: Knex) => {
  const repo = buildGoogleTokenRepository(db);
  const resolveAccessToken = resolveAccessTokenUseCase({ repo });
  const drive = buildDriveHttpClient({ resolveAccessToken });
  const controller = buildController({ drive });
  const router = Router();

  router.get('/files', authMiddleware, controller.listFiles);
  router.get('/files/:id', authMiddleware, controller.getFile);
  router.post('/folders', authMiddleware, controller.createFolder);
  router.patch('/files/:id', authMiddleware, controller.renameFile);
  router.post('/files/:id/move', authMiddleware, controller.moveFile);
  router.post('/files/:id/trash', authMiddleware, controller.trashFile);
  router.post('/files/:id/restore', authMiddleware, controller.restoreFile);
  router.delete('/files/:id', authMiddleware, controller.deleteFile);

  return router;
};
