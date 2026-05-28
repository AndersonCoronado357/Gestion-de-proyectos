const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const knex = require('knex');

const env = require('./config/env');
const knexConfig = require('./config/database');
const errorHandler = require('./shared/errors/error.handler');
const buildModuleXRoutes = require('./modules/module-x/adapters/entry/module-x.routes');
const buildAuthRoutes = require('./modules/auth/adapters/entry/auth.routes');
const buildMeRoutes = require('./modules/me/adapters/entry/me.routes');
const buildUsersRoutes = require('./modules/users/adapters/entry/users.routes');
const buildNavigationRoutes = require('./modules/navigation/adapters/entry/navigation.routes');
const buildRolesRoutes = require('./modules/roles/adapters/entry/roles.routes');
const buildServicesRoutes = require('./modules/services/adapters/entry/services.routes');
const buildRealtimeRoutes = require('./shared/realtime/realtime.routes');
const buildLoginContentRoutes = require('./modules/login-content/login-content.routes');

module.exports = function buildApp() {
  const db = knex(knexConfig[env.nodeEnv] || knexConfig.development);
  const app = express();

  // `trust proxy` permite que `req.ip` y X-Forwarded-* funcionen detrás de
  // un proxy / load balancer (Nginx, Cloudflare, etc.).
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: env.cors.origin, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  if (env.nodeEnv !== 'test') app.use(morgan('dev'));

  app.get('/health', (_req, res) => res.json({ status: 'ok', env: env.nodeEnv }));

  app.use('/api/auth', buildAuthRoutes(db));
  app.use('/api/me', buildMeRoutes(db));
  app.use('/api/users', buildUsersRoutes(db));
  app.use('/api/navigation', buildNavigationRoutes(db));
  app.use('/api/roles', buildRolesRoutes(db));
  app.use('/api/services', buildServicesRoutes(db));
  app.use('/api/events', buildRealtimeRoutes(db));
  app.use('/api/module-x', buildModuleXRoutes(db));
  app.use('/api/login-content', buildLoginContentRoutes(db));

  app.use((req, res) => res.status(404).json({ error: 'NOT_FOUND', path: req.path }));
  app.use(errorHandler);

  return { app, db };
};
