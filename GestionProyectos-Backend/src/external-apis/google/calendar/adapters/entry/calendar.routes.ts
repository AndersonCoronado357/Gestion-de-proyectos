import { Router } from 'express';
import type { Knex } from 'knex';
import { buildGoogleTokenRepository } from '../../../_shared/adapters/exit/google-token.repository.impl';
import { resolveAccessTokenUseCase } from '../../../_shared/use-cases/resolveAccessToken';
import { buildCalendarHttpClient } from '../exit/calendar.http.client';

const authMiddleware = require('../../../../../shared/middlewares/auth.middleware');
const buildController = require('./calendar.controller');

module.exports = (db: Knex) => {
  const repo = buildGoogleTokenRepository(db);
  const resolveAccessToken = resolveAccessTokenUseCase({ repo });
  const calendar = buildCalendarHttpClient({ resolveAccessToken });
  const controller = buildController({ calendar });
  const router = Router();

  router.get('/calendars', authMiddleware, controller.listCalendars);
  router.get(
    '/calendars/:calendarId/events',
    authMiddleware,
    controller.listEvents
  );
  router.get(
    '/calendars/:calendarId/events/:eventId',
    authMiddleware,
    controller.getEvent
  );
  router.post(
    '/calendars/:calendarId/events',
    authMiddleware,
    controller.createEvent
  );
  router.patch(
    '/calendars/:calendarId/events/:eventId',
    authMiddleware,
    controller.updateEvent
  );
  router.delete(
    '/calendars/:calendarId/events/:eventId',
    authMiddleware,
    controller.deleteEvent
  );

  return router;
};
