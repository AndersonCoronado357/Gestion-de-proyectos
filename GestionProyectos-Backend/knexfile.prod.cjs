// Knexfile de PRODUCCIÓN: usa las migraciones ya compiladas (.js en dist) y lee
// la conexión del entorno del proceso (las inyecta acmsy). Permite correr:
//   node node_modules/knex/bin/cli.js migrate:latest --knexfile knexfile.prod.cjs
// y apuntar a otra base con DB_NAME (p. ej. GestionProyectos_Test).
const num = (v, d) => {
  const n = parseInt(String(v ?? ''), 10);
  return Number.isFinite(n) ? n : d;
};
const bool = (v, d = false) =>
  v === undefined ? d : ['true', '1', 'yes'].includes(String(v).toLowerCase());

module.exports = {
  client: process.env.DB_CLIENT || 'mssql',
  connection: {
    server: process.env.DB_HOST || 'localhost',
    port: num(process.env.DB_PORT, 1433),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    options: {
      encrypt: bool(process.env.DB_ENCRYPT, false),
      trustServerCertificate: bool(process.env.DB_TRUST_CERT, true),
      enableArithAbort: true,
      requestTimeout: 60000,
      connectTimeout: 60000,
    },
  },
  pool: { min: 1, max: 5 },
  migrations: {
    directory: './dist/database/migrations',
    loadExtensions: ['.js'],
  },
  seeds: {
    directory: './dist/database/seeds',
    loadExtensions: ['.js'],
  },
};
