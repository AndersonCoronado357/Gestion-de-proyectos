// Bitácora unificada de la aplicación.
//
// Captura TODO lo que pasa en la app: errores (frontend y backend), llamadas
// HTTP, logs estructurados de aplicación y auditoría de acciones de usuario.
// Una sola tabla con clasificación por `level` y `category`, indexada para
// listar y filtrar rápido.

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE app_logs (
      id            BIGINT          IDENTITY(1,1) PRIMARY KEY,
      occurred_at   DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
      received_at   DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),

      -- Clasificación.
      level         VARCHAR(16)     NOT NULL,                  -- error|warn|info|debug|audit
      category      VARCHAR(32)     NOT NULL,                  -- http|exception|app|audit|console
      source        VARCHAR(16)     NOT NULL,                  -- frontend|backend

      -- Texto principal.
      message       NVARCHAR(2000)  NOT NULL DEFAULT '',
      logger_name   NVARCHAR(120)   NULL,                      -- módulo emisor (opcional)

      -- Correlación (para reconstruir un flujo).
      request_id    VARCHAR(48)     NULL,
      session_id    VARCHAR(64)     NULL,
      trace_id      VARCHAR(48)     NULL,
      user_id       INT             NULL,

      -- Detalles HTTP (cuando category='http').
      http_method   VARCHAR(10)     NULL,
      http_url      NVARCHAR(1000)  NULL,
      http_status   INT             NULL,
      duration_ms   INT             NULL,

      -- Contexto del cliente.
      ip            VARCHAR(64)     NULL,
      user_agent    NVARCHAR(500)   NULL,
      route         NVARCHAR(500)   NULL,

      -- Payload técnico (todos JSON serializados como NVARCHAR(MAX) — SQL Server
      -- 2016+ acepta JSON nativo pero NVARCHAR(MAX) es más portable).
      stack_trace   NVARCHAR(MAX)   NULL,
      context_json  NVARCHAR(MAX)   NULL,
      payload_json  NVARCHAR(MAX)   NULL,

      CONSTRAINT chk_app_logs_level CHECK (level IN ('error','warn','info','debug','audit')),
      CONSTRAINT chk_app_logs_source CHECK (source IN ('frontend','backend'))
    );

    -- Listados por fecha desc (lo más común).
    CREATE INDEX ix_app_logs_occurred ON app_logs (occurred_at DESC);
    -- Filtro por level/source/category.
    CREATE INDEX ix_app_logs_level_src ON app_logs (level, source, occurred_at DESC);
    CREATE INDEX ix_app_logs_category ON app_logs (category, occurred_at DESC);
    -- Correlación.
    CREATE INDEX ix_app_logs_request_id ON app_logs (request_id) WHERE request_id IS NOT NULL;
    CREATE INDEX ix_app_logs_session_id ON app_logs (session_id) WHERE session_id IS NOT NULL;
    CREATE INDEX ix_app_logs_user_id ON app_logs (user_id) WHERE user_id IS NOT NULL;
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP TABLE IF EXISTS app_logs');
}
