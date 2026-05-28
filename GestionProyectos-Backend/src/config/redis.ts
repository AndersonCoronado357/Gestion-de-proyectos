const env = require('./env');

module.exports = {
  host: env.redis.host,
  port: env.redis.port
};
