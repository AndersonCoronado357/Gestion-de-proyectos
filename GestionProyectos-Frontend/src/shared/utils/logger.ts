export const logger = {
  info: (...a) => console.info('[INFO]', ...a),
  warn: (...a) => console.warn('[WARN]', ...a),
  error: (...a) => console.error('[ERROR]', ...a),
  debug: (...a) => import.meta.env.DEV && console.log('[DEBUG]', ...a)
};
