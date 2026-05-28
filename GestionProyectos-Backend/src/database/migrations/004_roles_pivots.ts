// Tablas pivot que faltaban para el módulo de Roles & Permisos:
//
//   - role_services      → relación N:M roles ↔ services (cargos)
//   - permissions.resource ahora puede contener identificadores tipo
//     "submodule:42", por eso lo ampliamos a NVARCHAR(150).  Antes era
//     NVARCHAR(100) y para algunos paths/keys se quedaba justo.
//
// `role_permissions` y `permissions` ya existen del schema inicial.

import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // role_services — UNIQUE compuesto para idempotencia.
  await knex.raw(`
    CREATE TABLE role_services (
      id         INT       IDENTITY(1,1) PRIMARY KEY,
      role_id    INT       NOT NULL,
      service_id INT       NOT NULL,
      created_at DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
      created_by INT       NULL,
      CONSTRAINT uq_role_services UNIQUE (role_id, service_id),
      CONSTRAINT fk_role_services_role FOREIGN KEY (role_id)    REFERENCES roles (id),
      CONSTRAINT fk_role_services_svc  FOREIGN KEY (service_id) REFERENCES services (id)
    )
  `);
  await knex.raw(`CREATE INDEX ix_role_services_role ON role_services (role_id)`);
  await knex.raw(`CREATE INDEX ix_role_services_svc  ON role_services (service_id)`);

  // Ampliamos `resource` para permitir convenciones como "submodule:42".
  // Como tenía un UNIQUE compuesto (resource, action), hay que dropearlo
  // y recrearlo después del ALTER.
  await knex.raw(`
    ALTER TABLE permissions DROP CONSTRAINT uq_permissions_resource_action
  `);
  await knex.raw(`
    ALTER TABLE permissions ALTER COLUMN resource NVARCHAR(150) NOT NULL
  `);
  await knex.raw(`
    ALTER TABLE permissions
    ADD CONSTRAINT uq_permissions_resource_action UNIQUE (resource, action)
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE permissions DROP CONSTRAINT uq_permissions_resource_action
  `);
  await knex.raw(`
    ALTER TABLE permissions ALTER COLUMN resource NVARCHAR(100) NOT NULL
  `);
  await knex.raw(`
    ALTER TABLE permissions
    ADD CONSTRAINT uq_permissions_resource_action UNIQUE (resource, action)
  `);

  await knex.raw(`DROP INDEX ix_role_services_svc  ON role_services`);
  await knex.raw(`DROP INDEX ix_role_services_role ON role_services`);
  await knex.raw(`DROP TABLE role_services`);
}
