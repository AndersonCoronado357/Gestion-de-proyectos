import { Router } from 'express';
import type { Knex } from 'knex';
import { buildGoogleTokenRepository } from '../../../_shared/adapters/exit/google-token.repository.impl';
import { resolveAccessTokenUseCase } from '../../../_shared/use-cases/resolveAccessToken';
import { buildMeetHttpClient } from '../exit/meet.http.client';

const authMiddleware = require('../../../../../shared/middlewares/auth.middleware');
const buildController = require('./meet.controller');

module.exports = (db: Knex) => {
  const repo = buildGoogleTokenRepository(db);
  const resolveAccessToken = resolveAccessTokenUseCase({ repo });
  const meet = buildMeetHttpClient({ resolveAccessToken });
  const controller = buildController({ meet });
  const router = Router();

  router.post('/spaces', authMiddleware, controller.createSpace);
  router.get('/spaces/:id', authMiddleware, controller.getSpace);
  router.post(
    '/spaces/:id/end-active',
    authMiddleware,
    controller.endActiveConference
  );
  router.get(
    '/conference-records',
    authMiddleware,
    controller.listConferenceRecords
  );

  return router;
};
