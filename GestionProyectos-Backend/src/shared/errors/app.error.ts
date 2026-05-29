// Error de aplicación con statusCode + code amigable + details opcionales.
// Las factory functions (notFound, badRequest, ...) sirven de azúcar para
// no repetir status codes en todo el código.

class AppError extends Error {
  statusCode: number;
  code: string;
  details: unknown;

  constructor(
    message: string,
    statusCode = 500,
    code = 'APP_ERROR',
    details: unknown = undefined
  ) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static notFound(msg = 'Not Found'): AppError {
    return new AppError(msg, 404, 'NOT_FOUND');
  }
  static badRequest(msg = 'Bad Request', details?: unknown): AppError {
    return new AppError(msg, 400, 'BAD_REQUEST', details);
  }
  static unauthorized(msg = 'Unauthorized'): AppError {
    return new AppError(msg, 401, 'UNAUTHORIZED');
  }
  static forbidden(msg = 'Forbidden'): AppError {
    return new AppError(msg, 403, 'FORBIDDEN');
  }
  static conflict(msg = 'Conflict'): AppError {
    return new AppError(msg, 409, 'CONFLICT');
  }
  static internalServerError(msg = 'Internal Server Error'): AppError {
    return new AppError(msg, 500, 'INTERNAL');
  }
  static badGateway(msg = 'Bad Gateway'): AppError {
    return new AppError(msg, 502, 'BAD_GATEWAY');
  }
}

module.exports = AppError;
module.exports.default = AppError;
