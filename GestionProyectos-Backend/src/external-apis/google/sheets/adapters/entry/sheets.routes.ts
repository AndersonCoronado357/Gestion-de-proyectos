// Rutas del tester de Sheets — todas requieren auth y conexión activa
// de Google (eso último se chequea on-demand cuando el resolver no
// encuentra refresh, devolviendo un 400 claro).
//
// Wireup:
//   app.use('/api/external-apis/google/sheets', buildSheetsRoutes(db));

import { Router } from 'express';
import type { Knex } from 'knex';
import { buildGoogleTokenRepository } from '../../../_shared/adapters/exit/google-token.repository.impl';
import { resolveAccessTokenUseCase } from '../../../_shared/use-cases/resolveAccessToken';
import { buildSheetsHttpClient } from '../exit/sheets.http.client';

const authMiddleware = require('../../../../../shared/middlewares/auth.middleware');
const buildController = require('./sheets.controller');

module.exports = (db: Knex) => {
  const repo = buildGoogleTokenRepository(db);
  const resolveAccessToken = resolveAccessTokenUseCase({ repo });
  const sheets = buildSheetsHttpClient({ resolveAccessToken });
  const controller = buildController({ sheets });
  const router = Router();

  // Spreadsheet level.
  router.get('/spreadsheets', authMiddleware, controller.listSpreadsheets);
  router.post('/spreadsheets', authMiddleware, controller.createSpreadsheet);
  router.get('/spreadsheets/:id', authMiddleware, controller.getSpreadsheet);
  router.patch('/spreadsheets/:id', authMiddleware, controller.renameSpreadsheet);
  router.delete('/spreadsheets/:id', authMiddleware, controller.deleteSpreadsheet);

  // Sheet (tab) level.
  router.post('/spreadsheets/:id/sheets', authMiddleware, controller.addSheet);
  router.patch('/spreadsheets/:id/sheets/:sheetId', authMiddleware, controller.renameSheet);
  router.post('/spreadsheets/:id/sheets/:sheetId/duplicate', authMiddleware, controller.duplicateSheet);
  router.delete('/spreadsheets/:id/sheets/:sheetId', authMiddleware, controller.deleteSheet);

  // Values level.
  router.get('/spreadsheets/:id/values', authMiddleware, controller.readRange);
  router.put('/spreadsheets/:id/values', authMiddleware, controller.writeRange);
  router.post('/spreadsheets/:id/values/append', authMiddleware, controller.appendRow);
  router.post('/spreadsheets/:id/values/clear', authMiddleware, controller.clearRange);

  return router;
};
