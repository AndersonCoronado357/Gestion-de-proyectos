const env = require('./config/env');
const buildApp = require('./app');
const logger = require('./shared/utils/logger');

const { app } = buildApp();

const server = app.listen(env.port, () => {
  logger.info(`Server listening on http://localhost:${env.port}`);
});

const shutdown = (signal) => {
  logger.info(`${signal} received, shutting down...`);
  server.close(() => process.exit(0));
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
