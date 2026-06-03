// Error handler global de Express.
//
// - AppError → respuesta tipada con código/detalle.
// - Excepciones inesperadas → 500 (mensaje detallado en dev, genérico en prod)
//   y se persisten en `app_logs` para verlas en el módulo de Logs.

const AppError = require('./app.error');
const logger = require('../utils/logger');

const isDev = (process.env.NODE_ENV || 'development') !== 'production';

// Recibe { logRepository } opcional; lo dejamos `any` porque el archivo es JS.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
module.exports = (opts: any = {}) => {
  const logRepository = opts.logRepository;
  return (err, req, res, _next) => {
    if (err instanceof AppError) {
      return res.status(err.statusCode).json({
        error: err.code,
        message: err.message,
        details: err.details
      });
    }
    logger.error('Unexpected error:', err);

    // Persistir la excepción no manejada en la bitácora.
    if (logRepository) {
      const occurredAt = new Date().toISOString();
      const status = 500;
      logRepository
        .insert({
          occurredAt,
          level: 'error',
          category: 'exception',
          source: 'backend',
          message: `Unhandled: ${err?.message ?? String(err)}`,
          loggerName: 'error.handler',
          requestId: req?.requestId ?? null,
          userId: req?.user?.id ?? null,
          httpMethod: req?.method ?? null,
          httpUrl: req?.originalUrl ?? null,
          httpStatus: status,
          ip: req?.ip ?? null,
          userAgent: req?.get?.('user-agent') ?? null,
          route: req?.route?.path ?? null,
          stackTrace: err?.stack ? String(err.stack) : null,
          context: { name: err?.name ?? null, code: err?.code ?? null }
        })
        .catch(() => undefined);
    }

    res.status(500).json({
      error: 'INTERNAL',
      message: isDev
        ? `Internal Server Error: ${err?.message ?? err}`
        : 'Internal Server Error',
      ...(isDev && err?.stack
        ? { stack: String(err.stack).split('\n').slice(0, 6) }
        : {})
    });
  };
};
