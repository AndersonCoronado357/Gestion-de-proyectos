// Routes del módulo de autenticación.
//
//   POST /api/auth/login    público
//   POST /api/auth/refresh  público (lee cookie HttpOnly)
//   POST /api/auth/logout   público (lee cookie HttpOnly)
//   GET  /api/auth/me       protegido (Bearer access token)

import type { Knex } from 'knex';
import { Router } from 'express';
import Joi from 'joi';

const validate = require('../../../../shared/middlewares/validate.middleware');
const authMiddleware = require('../../../../shared/middlewares/auth.middleware');
const TokenRepositoryImpl = require('../exit/token.repository.impl');
const UserRepositoryImpl = require('../exit/user.repository.impl');
const PreferencesRepositoryImpl = require('../../../me/adapters/exit/preferences.repository.impl');
const buildController = require('./auth.controller');
const loginUC = require('../../use-cases/login');
const loginWithGoogleUC = require('../../use-cases/loginWithGoogle');
const logoutUC = require('../../use-cases/logout');
const refreshUC = require('../../use-cases/refreshToken');
const getMeUC = require('../../use-cases/getMe');

const loginSchema = Joi.object({
  username: Joi.string().min(1).required(),
  password: Joi.string().min(1).required(),
  // `remember` opcional — el front lo manda según el checkbox del form.
  // Si es false, la cookie del refresh se setea sin maxAge → session
  // cookie → browser la borra al cerrar la pestaña/navegador.
  remember: Joi.boolean().optional()
});

module.exports = (db: Knex) => {
  const userRepository = new UserRepositoryImpl(db);
  const tokenRepository = new TokenRepositoryImpl(db);
  const preferencesRepository = new PreferencesRepositoryImpl(db);

  const useCases = {
    login: loginUC({ userRepository, tokenRepository, preferencesRepository }),
    loginWithGoogle: loginWithGoogleUC({
      userRepository,
      tokenRepository,
      preferencesRepository
    }),
    logout: logoutUC({ tokenRepository }),
    refresh: refreshUC({ userRepository, tokenRepository }),
    getMe: getMeUC({ userRepository, preferencesRepository })
  };
  const controller = buildController({ useCases });
  const router = Router();

  router.post('/login', validate(loginSchema), controller.login);
  router.post('/google', controller.google);
  router.post('/refresh', controller.refresh);
  router.post('/logout', controller.logout);
  router.get('/me', authMiddleware, controller.me);

  return router;
};
