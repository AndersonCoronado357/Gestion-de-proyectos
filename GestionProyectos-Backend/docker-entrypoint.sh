#!/bin/sh
# Corre migraciones pendientes (idempotente, best-effort) y arranca el server.
# Best-effort: si la BD no responde aún, NO bloquea el arranque del servidor.
echo "[entrypoint] migrate:latest (best-effort)..."
node node_modules/knex/bin/cli.js migrate:latest --knexfile knexfile.prod.cjs || echo "[entrypoint] migrate fallo o sin pendientes, continuo"
echo "[entrypoint] iniciando server..."
exec node dist/server.js
