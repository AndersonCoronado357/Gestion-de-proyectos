// Migración inicial: schema completo.
//
// Mantiene los estándares acordados:
//   - snake_case, inglés, tablas en plural
//   - timestamps unificados (created_at, updated_at) + soft-delete (deleted_at)
//   - password_hash, nunca texto plano
//   - UNIQUE constraints donde corresponde
//   - status como TINYINT con CHECK
//   - RBAC granular (permissions con resource + action)
//   - Índices en FKs y columnas de búsqueda frecuente
//
// Se ejecuta como `knex.raw` porque usa features específicos de SQL Server
// (TINYINT, NVARCHAR(MAX) + ISJSON, índices filtrados, triggers).

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // ============================================================
  // CATÁLOGO / LOOKUP
  // ============================================================

  await knex.raw(`
    CREATE TABLE modules (
      id            INT           IDENTITY(1,1) PRIMARY KEY,
      name          NVARCHAR(100) NOT NULL,
      icon          NVARCHAR(100) NULL,
      display_order TINYINT       NOT NULL DEFAULT 0,
      created_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
      updated_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
      created_by    INT           NULL,
      updated_by    INT           NULL,
      deleted_at    DATETIME2     NULL
    )
  `);

  await knex.raw(`
    CREATE TABLE submodules (
      id            INT           IDENTITY(1,1) PRIMARY KEY,
      module_id     INT           NOT NULL,
      name          NVARCHAR(100) NOT NULL,
      icon          NVARCHAR(100) NULL,
      display_order TINYINT       NOT NULL DEFAULT 0,
      created_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
      updated_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
      created_by    INT           NULL,
      updated_by    INT           NULL,
      deleted_at    DATETIME2     NULL,
      CONSTRAINT fk_submodules_module FOREIGN KEY (module_id) REFERENCES modules (id)
    )
  `);

  await knex.raw(`
    CREATE TABLE positions (
      id            INT           IDENTITY(1,1) PRIMARY KEY,
      code          NVARCHAR(20)  NOT NULL,
      description   NVARCHAR(255) NOT NULL,
      health_center NVARCHAR(150) NULL,
      created_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
      updated_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
      created_by    INT           NULL,
      updated_by    INT           NULL,
      deleted_at    DATETIME2     NULL,
      CONSTRAINT uq_positions_code UNIQUE (code)
    )
  `);

  await knex.raw(`
    CREATE TABLE services (
      id            INT           IDENTITY(1,1) PRIMARY KEY,
      code          NVARCHAR(20)  NOT NULL,
      description   NVARCHAR(255) NOT NULL,
      health_center NVARCHAR(150) NULL,
      created_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
      updated_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
      created_by    INT           NULL,
      updated_by    INT           NULL,
      deleted_at    DATETIME2     NULL,
      CONSTRAINT uq_services_code UNIQUE (code)
    )
  `);

  await knex.raw(`
    CREATE TABLE roles (
      id          INT           IDENTITY(1,1) PRIMARY KEY,
      name        NVARCHAR(100) NOT NULL,
      description NVARCHAR(255) NULL,
      created_at  DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
      updated_at  DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
      created_by  INT           NULL,
      updated_by  INT           NULL,
      deleted_at  DATETIME2     NULL,
      CONSTRAINT uq_roles_name UNIQUE (name)
    )
  `);

  // RBAC: permissions = resource + action.
  // resource: 'users', 'reports', ...
  // action:   'read' | 'create' | 'update' | 'delete' | 'export' | ...
  await knex.raw(`
    CREATE TABLE permissions (
      id          INT           IDENTITY(1,1) PRIMARY KEY,
      resource    NVARCHAR(100) NOT NULL,
      action      NVARCHAR(50)  NOT NULL,
      description NVARCHAR(255) NULL,
      created_at  DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
      CONSTRAINT uq_permissions_resource_action UNIQUE (resource, action)
    )
  `);

  // Preferencias de UI como JSON flexible — evita migrar el schema cada
  // vez que se agrega una preferencia nueva.
  await knex.raw(`
    CREATE TABLE ui_themes (
      id          INT           IDENTITY(1,1) PRIMARY KEY,
      name        NVARCHAR(100) NOT NULL,
      preferences NVARCHAR(MAX) NOT NULL
        CONSTRAINT chk_ui_themes_json CHECK (ISJSON(preferences) = 1),
      created_at  DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
      updated_at  DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
      deleted_at  DATETIME2     NULL,
      CONSTRAINT uq_ui_themes_name UNIQUE (name)
    )
  `);

  // ============================================================
  // USUARIOS
  // ============================================================

  // status: 0=pending · 1=active · 2=inactive · 3=suspended
  await knex.raw(`
    CREATE TABLE users (
      id            INT           IDENTITY(1,1) PRIMARY KEY,
      username      NVARCHAR(100) NOT NULL,
      email         NVARCHAR(255) NOT NULL,
      password_hash NVARCHAR(255) NOT NULL,
      first_name    NVARCHAR(100) NOT NULL,
      last_name     NVARCHAR(100) NOT NULL,
      phone         NVARCHAR(30)  NULL,
      status        TINYINT       NOT NULL DEFAULT 1
        CONSTRAINT chk_users_status CHECK (status IN (0, 1, 2, 3)),
      last_login_at DATETIME2     NULL,
      created_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
      updated_at    DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
      created_by    INT           NULL,
      updated_by    INT           NULL,
      deleted_at    DATETIME2     NULL,
      CONSTRAINT uq_users_username UNIQUE (username),
      CONSTRAINT uq_users_email    UNIQUE (email)
    )
  `);

  // ============================================================
  // PIVOT N:M
  // ============================================================

  await knex.raw(`
    CREATE TABLE user_roles (
      id         INT       IDENTITY(1,1) PRIMARY KEY,
      user_id    INT       NOT NULL,
      role_id    INT       NOT NULL,
      created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
      created_by INT       NULL,
      CONSTRAINT uq_user_roles UNIQUE (user_id, role_id),
      CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users (id),
      CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles (id)
    )
  `);

  await knex.raw(`
    CREATE TABLE role_permissions (
      id            INT       IDENTITY(1,1) PRIMARY KEY,
      role_id       INT       NOT NULL,
      permission_id INT       NOT NULL,
      created_at    DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
      created_by    INT       NULL,
      CONSTRAINT uq_role_permissions UNIQUE (role_id, permission_id),
      CONSTRAINT fk_role_perms_role FOREIGN KEY (role_id)       REFERENCES roles (id),
      CONSTRAINT fk_role_perms_perm FOREIGN KEY (permission_id) REFERENCES permissions (id)
    )
  `);

  await knex.raw(`
    CREATE TABLE user_positions (
      id          INT       IDENTITY(1,1) PRIMARY KEY,
      user_id     INT       NOT NULL,
      position_id INT       NOT NULL,
      created_at  DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
      created_by  INT       NULL,
      CONSTRAINT uq_user_positions UNIQUE (user_id, position_id),
      CONSTRAINT fk_user_pos_user FOREIGN KEY (user_id)     REFERENCES users (id),
      CONSTRAINT fk_user_pos_pos  FOREIGN KEY (position_id) REFERENCES positions (id)
    )
  `);

  await knex.raw(`
    CREATE TABLE user_services (
      id         INT       IDENTITY(1,1) PRIMARY KEY,
      user_id    INT       NOT NULL,
      service_id INT       NOT NULL,
      created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
      created_by INT       NULL,
      CONSTRAINT uq_user_services UNIQUE (user_id, service_id),
      CONSTRAINT fk_user_svc_user FOREIGN KEY (user_id)    REFERENCES users (id),
      CONSTRAINT fk_user_svc_svc  FOREIGN KEY (service_id) REFERENCES services (id)
    )
  `);

  // Un usuario tiene UN tema base + overrides personales en JSON.
  await knex.raw(`
    CREATE TABLE user_ui_themes (
      id          INT           IDENTITY(1,1) PRIMARY KEY,
      user_id     INT           NOT NULL,
      ui_theme_id INT           NOT NULL,
      overrides   NVARCHAR(MAX) NULL
        CONSTRAINT chk_user_ui_overrides_json CHECK (overrides IS NULL OR ISJSON(overrides) = 1),
      created_at  DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
      updated_at  DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
      CONSTRAINT uq_user_ui_themes UNIQUE (user_id),
      CONSTRAINT fk_user_ui_user  FOREIGN KEY (user_id)     REFERENCES users (id),
      CONSTRAINT fk_user_ui_theme FOREIGN KEY (ui_theme_id) REFERENCES ui_themes (id)
    )
  `);

  // ============================================================
  // SESIONES (refresh tokens)
  // ============================================================

  await knex.raw(`
    CREATE TABLE sessions (
      id         INT           IDENTITY(1,1) PRIMARY KEY,
      user_id    INT           NOT NULL,
      token_hash NVARCHAR(255) NOT NULL,
      ip_address NVARCHAR(45)  NULL,
      user_agent NVARCHAR(500) NULL,
      expires_at DATETIME2     NOT NULL,
      revoked_at DATETIME2     NULL,
      created_at DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
      CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id)
    )
  `);

  // ============================================================
  // ACCESS LOGS (inmutable: solo INSERT, sin UPDATE/DELETE)
  // ============================================================

  await knex.raw(`
    CREATE TABLE access_logs (
      id           BIGINT        IDENTITY(1,1) PRIMARY KEY,
      user_id      INT           NULL,
      event_type   NVARCHAR(30)  NOT NULL,
      ip_address   NVARCHAR(45)  NULL,
      user_agent   NVARCHAR(500) NULL,
      submodule_id INT           NULL,
      detail       NVARCHAR(500) NULL,
      created_at   DATETIME2     NOT NULL DEFAULT SYSUTCDATETIME(),
      CONSTRAINT fk_access_logs_user      FOREIGN KEY (user_id)      REFERENCES users (id),
      CONSTRAINT fk_access_logs_submodule FOREIGN KEY (submodule_id) REFERENCES submodules (id),
      CONSTRAINT chk_access_logs_event CHECK (
        event_type IN ('login_ok','login_fail','logout','token_refresh','password_reset','access_denied')
      )
    )
  `);

  // ============================================================
  // ÍNDICES
  // ============================================================

  // Filtrados por deleted_at IS NULL — sólo indexan registros vivos.
  await knex.raw(`CREATE INDEX ix_users_email    ON users (email)    WHERE deleted_at IS NULL`);
  await knex.raw(`CREATE INDEX ix_users_username ON users (username) WHERE deleted_at IS NULL`);
  await knex.raw(`CREATE INDEX ix_users_status   ON users (status)   WHERE deleted_at IS NULL`);

  await knex.raw(`CREATE INDEX ix_user_roles_user ON user_roles (user_id)`);
  await knex.raw(`CREATE INDEX ix_user_roles_role ON user_roles (role_id)`);
  await knex.raw(`CREATE INDEX ix_role_perms_role ON role_permissions (role_id)`);
  await knex.raw(`CREATE INDEX ix_role_perms_perm ON role_permissions (permission_id)`);
  await knex.raw(`CREATE INDEX ix_user_pos_user   ON user_positions (user_id)`);
  await knex.raw(`CREATE INDEX ix_user_svc_user   ON user_services  (user_id)`);

  await knex.raw(`CREATE INDEX ix_submodules_module ON submodules (module_id) WHERE deleted_at IS NULL`);

  await knex.raw(`CREATE INDEX ix_sessions_user    ON sessions (user_id)`);
  await knex.raw(`CREATE INDEX ix_sessions_expires ON sessions (expires_at) WHERE revoked_at IS NULL`);

  await knex.raw(`CREATE INDEX ix_access_logs_user ON access_logs (user_id)`);
  await knex.raw(`CREATE INDEX ix_access_logs_date ON access_logs (created_at)`);

  // ============================================================
  // TRIGGER: actualizar updated_at automáticamente.
  // Patrón replicable para roles, positions, services, modules,
  // submodules, ui_themes, user_ui_themes si se necesita.
  // ============================================================

  await knex.raw(`
    CREATE OR ALTER TRIGGER trg_users_updated_at
    ON users
    AFTER UPDATE
    AS
    BEGIN
      SET NOCOUNT ON;
      UPDATE users
      SET    updated_at = SYSUTCDATETIME()
      FROM   users u
      JOIN   inserted i ON u.id = i.id;
    END
  `);
}

export async function down(knex: Knex): Promise<void> {
  // Orden inverso: primero tablas que referencian, luego las referenciadas.

  await knex.raw(`IF OBJECT_ID('trg_users_updated_at', 'TR') IS NOT NULL DROP TRIGGER trg_users_updated_at`);

  await knex.raw(`DROP TABLE IF EXISTS access_logs`);
  await knex.raw(`DROP TABLE IF EXISTS sessions`);
  await knex.raw(`DROP TABLE IF EXISTS user_ui_themes`);
  await knex.raw(`DROP TABLE IF EXISTS user_services`);
  await knex.raw(`DROP TABLE IF EXISTS user_positions`);
  await knex.raw(`DROP TABLE IF EXISTS role_permissions`);
  await knex.raw(`DROP TABLE IF EXISTS user_roles`);
  await knex.raw(`DROP TABLE IF EXISTS users`);
  await knex.raw(`DROP TABLE IF EXISTS ui_themes`);
  await knex.raw(`DROP TABLE IF EXISTS permissions`);
  await knex.raw(`DROP TABLE IF EXISTS roles`);
  await knex.raw(`DROP TABLE IF EXISTS services`);
  await knex.raw(`DROP TABLE IF EXISTS positions`);
  await knex.raw(`DROP TABLE IF EXISTS submodules`);
  await knex.raw(`DROP TABLE IF EXISTS modules`);
}
