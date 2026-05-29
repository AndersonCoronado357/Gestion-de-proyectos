const AppError = require('./app.error');
const logger = require('../utils/logger');

const isDev = (process.env.NODE_ENV || 'development') !== 'production';

module.exports = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      details: err.details
    });
  }
  logger.error('Unexpected error:', err);
  // En dev mandamos el mensaje del error al cliente para poder diagnosticar
  // sin tener que mirar la consola del backend.  En prod queda genérico.
  res.status(500).json({
    error: 'INTERNAL',
    message: isDev
      ? `Internal Server Error: ${err?.message ?? err}`
      : 'Internal Server Error',
    ...(isDev && err?.stack ? { stack: String(err.stack).split('\n').slice(0, 6) } : {})
  });
};
