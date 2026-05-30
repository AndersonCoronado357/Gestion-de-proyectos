export class AppError extends Error {
  code: string;
  details: unknown;

  constructor(message: string, code: string = 'APP_ERROR', details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}
