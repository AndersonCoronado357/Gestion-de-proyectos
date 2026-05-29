const env = require('../../config/env');

const levels = { error: 0, warn: 1, info: 2, debug: 3 };
const current = levels[env.logLevel] ?? 2;

const log = (level, ...args) => {
  if ((levels[level] ?? 2) <= current) {
    const ts = new Date().toISOString();
    const fn = level === 'debug' ? 'log' : level;
    console[fn](`[${ts}] [${level.toUpperCase()}]`, ...args);
  }
};

module.exports = {
  error: (...a) => log('error', ...a),
  warn: (...a) => log('warn', ...a),
  info: (...a) => log('info', ...a),
  debug: (...a) => log('debug', ...a)
};
