const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const knex = require('knex');

const env = require('./config/env');
const knexConfig = require('./config/database');
const buildErrorHandler = require('./shared/errors/error.handler');
const buildModuleXRoutes = require('./modules/module-x/adapters/entry/module-x.routes');
const buildAuthRoutes = require('./modules/auth/adapters/entry/auth.routes');
const buildMeRoutes = require('./modules/preferences/adapters/entry/me.routes');
const buildUsersRoutes = require('./modules/users/adapters/entry/users.routes');
const buildNavigationRoutes = require('./modules/navigation/adapters/entry/navigation.routes');
const buildRolesRoutes = require('./modules/roles-and-permissions/adapters/entry/roles.routes');
const buildServicesRoutes = require('./modules/services/adapters/entry/services.routes');
const buildRealtimeRoutes = require('./shared/realtime/realtime.routes');
const buildLoginContentRoutes = require('./modules/login-content/login-content.routes');
const buildBuilderRoutes = require('./modules/page-builder/builder.routes');
const buildTestRunnerRoutes = require('./modules/test-runner/test-runner.routes');
const buildLogsRoutes = require('./modules/logs/adapters/entry/logs.routes');
const buildIconsRoutes = require('./modules/icons/adapters/entry/icons.routes');
const LogRepositoryImpl = require('./modules/logs/adapters/exit/log.repository.impl');
const { buildLogsMiddleware } = require('./modules/logs/adapters/entry/logs.middleware');

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

  // Bitácora unificada: middleware ANTES de las rutas para inyectar request-id
  // y capturar cada llamada HTTP. El repo se reusa luego en el error handler.
  const logRepository = new LogRepositoryImpl(db);
  app.use(buildLogsMiddleware(logRepository));

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
  app.use('/api/builder', buildBuilderRoutes(db));
  app.use('/api/test-runner', buildTestRunnerRoutes(db));
  app.use('/api/logs', buildLogsRoutes(db));
  app.use('/api/icons', buildIconsRoutes(db));

  app.use((req, res) => res.status(404).json({ error: 'NOT_FOUND', path: req.path }));
  // El error handler recibe el repo para persistir excepciones no manejadas.
  app.use(buildErrorHandler({ logRepository }));

  return { app, db };
};
