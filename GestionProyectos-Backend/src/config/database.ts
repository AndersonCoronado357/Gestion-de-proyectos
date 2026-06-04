const path = require('path');
const env = require('./env');

const baseConfig = {
  client: env.db.client,
  connection: {
    server: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    database: env.db.name,
    options: {
      encrypt: env.db.encrypt,
      trustServerCertificate: env.db.trustServerCertificate,
      enableArithAbort: true,
      // Tedious default = 15 s. SQL Server local (Express, Developer) puede
      // pasarse fácil con auto-update stats o I/O contention en queries
      // amplias (joins con icons, listados de app_logs). 30 s da margen.
      requestTimeout: 30000,
      connectTimeout: 30000
    }
  },
  pool: { min: 2, max: 10 },
  migrations: {
    directory: path.resolve(__dirname, '../database/migrations'),
    extension: 'ts',
    loadExtensions: ['.ts']
  },
  seeds: {
    directory: path.resolve(__dirname, '../database/seeds'),
    extension: 'ts',
    loadExtensions: ['.ts']
  }
};

module.exports = {
  development: baseConfig,
  test: baseConfig,
  production: baseConfig
};
