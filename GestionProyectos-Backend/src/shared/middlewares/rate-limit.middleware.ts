const rateLimit = require('express-rate-limit');
const env = require('../../config/env');

module.exports = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false
});
