// Routes del módulo "me".
//
//   GET  /api/me/preferences    protegido
//   PUT  /api/me/preferences    protegido
//   POST /api/me/activity       protegido (heartbeat de inactividad)

import type { Knex } from 'knex';
import { Router } from 'express';
import Joi from 'joi';

const validate = require('../../../../shared/middlewares/validate.middleware');
const authMiddleware = require('../../../../shared/middlewares/auth.middleware');
const PreferencesRepositoryImpl = require('../exit/preferences.repository.impl');
const UserRepositoryImpl = require('../../../auth/adapters/exit/user.repository.impl');
const buildController = require('./me.controller');
const getPreferencesUC = require('../../use-cases/getPreferences');
const updatePreferencesUC = require('../../use-cases/updatePreferences');
const markActivityUC = require('../../use-cases/markActivity');

const preferencesSchema = Joi.object({
  mode: Joi.string().valid('light', 'dark').required(),
  // Hex de 6 caracteres con '#' delante.
  accentHex: Joi.string()
    .pattern(/^#[0-9a-fA-F]{6}$/)
    .required(),
  fontFamily: Joi.string().min(1).max(64).required(),
  fontSize: Joi.string().valid('xs', 'sm', 'md', 'lg', 'xl').required()
});

module.exports = (db: Knex) => {
  const preferencesRepository = new PreferencesRepositoryImpl(db);
  const userRepository = new UserRepositoryImpl(db);
  const useCases = {
    getPreferences: getPreferencesUC({ preferencesRepository }),
    updatePreferences: updatePreferencesUC({ preferencesRepository }),
    markActivity: markActivityUC({ userRepository })
  };
  const controller = buildController({ useCases });
  const router = Router();

  router.get('/preferences', authMiddleware, controller.getPreferences);
  router.put(
    '/preferences',
    authMiddleware,
    validate(preferencesSchema),
    controller.updatePreferences
  );
  router.post('/activity', authMiddleware, controller.markActivity);

  return router;
};
