// Normalización de keys en `permissions.resource`.
//
// Bug histórico: el frontend (useResources.ts) generaba IDs de submódulo
// prefijados — "sub-<id>" — y esos pasaban tal cual al backend, que
// terminaba guardando filas como `resource = 'submodule:sub-5'`.  El
// gate de acceso del frontend (canViewSubmodule) usa el ID crudo del
// submódulo (un número), así que buscaba `submodule:5:view` y nunca
// matcheaba — los permisos quedaban tildados en la UI pero no abrían
// acceso real.
//
// Esta migración:
//   1. Reemplaza el prefijo viejo "submodule:sub-" por "submodule:" en
//      todas las filas de `permissions`.
//   2. Si ya existía una fila para la versión "limpia" del recurso
//      (mismo action), borramos la duplicada y reapuntamos los
//      role_permissions a la canónica antes de eliminar la fila vieja.
//      Sino el UNIQUE (resource, action) explotaría al hacer el UPDATE.
//
// Idempotente: si no hay filas con el prefijo viejo, no hace nada.

import type { Knex } from 'knex';

const LEGACY_PREFIX = 'submodule:sub-';
const NEW_PREFIX = 'submodule:';

export async function up(knex: Knex): Promise<void> {
  // 1) Repuntar `role_permissions` de las filas viejas → fila canónica
  //    (cuando ya existía).  Después borramos los duplicados de role_permissions
  //    para no violar el UNIQUE compuesto del pivot.
  await knex.raw(`
    UPDATE rp
       SET rp.permission_id = canonical.id
      FROM role_permissions rp
      JOIN permissions legacy   ON legacy.id = rp.permission_id
      JOIN permissions canonical
        ON canonical.resource = N'${NEW_PREFIX}' + SUBSTRING(legacy.resource, ${LEGACY_PREFIX.length + 1}, 4000)
       AND canonical.action   = legacy.action
     WHERE legacy.resource LIKE N'${LEGACY_PREFIX}%'
       AND canonical.id <> legacy.id
  `);

  // Borrar duplicados (mismo role_id + permission_id) que pudieron
  // quedar tras el repuntado.
  await knex.raw(`
    ;WITH dupes AS (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY role_id, permission_id ORDER BY id
             ) AS rn
        FROM role_permissions
    )
    DELETE FROM dupes WHERE rn > 1
  `);

  // 2) Para las filas viejas que NO tenían canónica, las renombramos
  //    in-place — ahora son las canónicas.
  await knex.raw(`
    UPDATE permissions
       SET resource = N'${NEW_PREFIX}' + SUBSTRING(resource, ${LEGACY_PREFIX.length + 1}, 4000)
     WHERE resource LIKE N'${LEGACY_PREFIX}%'
       AND NOT EXISTS (
         SELECT 1 FROM permissions p2
          WHERE p2.resource = N'${NEW_PREFIX}' + SUBSTRING(permissions.resource, ${LEGACY_PREFIX.length + 1}, 4000)
            AND p2.action   = permissions.action
       )
  `);

  // 3) Las filas viejas que SÍ tenían canónica ya están huérfanas
  //    (sus role_permissions fueron repuntados).  Las borramos.
  await knex.raw(`
    DELETE FROM permissions
     WHERE resource LIKE N'${LEGACY_PREFIX}%'
  `);
}

export async function down(_knex: Knex): Promise<void> {
  // No revertimos.  El estado "canónico" es estrictamente mejor que el
  // viejo (matchea con el gate de acceso); revertirlo sería volver a un
  // bug.  Si necesitás reproducir el estado anterior, lo hacés a mano.
}
