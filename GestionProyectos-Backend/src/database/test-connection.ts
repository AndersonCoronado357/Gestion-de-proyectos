const knex = require('knex');
const env = require('../config/env');
const knexConfig = require('../config/database');

interface ErrorLike {
  message?: string;
  code?: string;
}

function asErrorLike(err: unknown): ErrorLike {
  if (err && typeof err === 'object') return err as ErrorLike;
  return { message: String(err) };
}

(async () => {
  console.log(
    `[db:test] Connecting to ${env.db.host}:${env.db.port}/${env.db.name} as ${env.db.user}...`
  );
  const db = knex(knexConfig[env.nodeEnv] || knexConfig.development);
  try {
    const rows = await db.raw('SELECT 1 AS ok, GETDATE() AS server_time');
    console.log('[db:test] [OK] Connection succeeded.');
    console.log(rows);
  } catch (err: unknown) {
    const e = asErrorLike(err);
    console.error('[db:test] [FAIL] Connection failed:', e.message);
    if (e.code) console.error('         code:', e.code);
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
})();
