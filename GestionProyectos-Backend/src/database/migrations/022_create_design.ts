// Tablas para el constructor visual de páginas ("Diseñador").
//
// `design_projects`: cada proyecto es un módulo en construcción. Tiene un
// nombre y referencia a la vista "inicial" (la que se muestra al entrar).
//
// `design_views`: cada proyecto tiene N vistas (pantallas). Cada vista
// guarda DOS disposiciones independientes (desktop y mobile) como JSON
// con la lista de bloques + sus posiciones + sus propiedades. Editar
// una NO altera la otra.

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    CREATE TABLE design_projects (
      id              BIGINT          IDENTITY(1,1) PRIMARY KEY,
      name            NVARCHAR(200)   NOT NULL,
      created_by      INT             NULL,
      primary_view_id BIGINT          NULL,
      created_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME(),
      updated_at      DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME()
    );

    CREATE TABLE design_views (
      id               BIGINT         IDENTITY(1,1) PRIMARY KEY,
      project_id       BIGINT         NOT NULL,
      name             NVARCHAR(120)  NOT NULL DEFAULT 'Vista',
      position         INT            NOT NULL DEFAULT 0,
      content_desktop  NVARCHAR(MAX)  NULL,
      content_mobile   NVARCHAR(MAX)  NULL,
      created_at       DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
      updated_at       DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
      CONSTRAINT fk_design_views_project
        FOREIGN KEY (project_id) REFERENCES design_projects(id)
        ON DELETE CASCADE
    );

    CREATE INDEX ix_design_views_project ON design_views (project_id, position);

    ALTER TABLE design_projects
      ADD CONSTRAINT fk_design_projects_primary_view
      FOREIGN KEY (primary_view_id) REFERENCES design_views(id);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    IF OBJECT_ID('fk_design_projects_primary_view', 'F') IS NOT NULL
      ALTER TABLE design_projects DROP CONSTRAINT fk_design_projects_primary_view;
    DROP TABLE IF EXISTS design_views;
    DROP TABLE IF EXISTS design_projects;
  `);
}
