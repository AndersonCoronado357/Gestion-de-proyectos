// Seed del módulo "Administración" con sus 4 submódulos.
//
// Este seed define lo que el front muestra en el sidebar como datos
// iniciales — luego el admin puede mover, renombrar o agregar más cosas
// desde la página de "Módulos y submódulos" (PUT /api/navigation/tree).
//
// Idempotente: si ya existen las filas, las re-actualiza (icon, path,
// display_order). No borra módulos ajenos creados por el usuario después.
//
// Los iconos son SVGs inline estilo "outline" (24×24, stroke=currentColor)
// — así toman el color del tema en el sidebar.

import type { Knex } from 'knex';

// Iconos en bloque para que el SQL quede legible.
const ICON_SHIELD = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2 4 5v6c0 5 3.5 9.5 8 11 4.5-1.5 8-6 8-11V5l-8-3Z"/></svg>`;
const ICON_BOX = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="m3 8 9 5 9-5"/><path d="M3 8v8l9 5 9-5V8"/><path d="m12 13 0 8"/></svg>`;
const ICON_KEY = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.5 12.5 9-9"/><path d="m16 7 3 3"/><path d="m18 5 3 3"/></svg>`;
const ICON_USER = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7"/></svg>`;
const ICON_PUZZLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h4V4a2 2 0 1 1 4 0v3h4v4a2 2 0 1 0 0 4v4h-4a2 2 0 1 0-4 0H4v-4a2 2 0 1 1 0-4V7Z"/></svg>`;
const ICON_PANEL = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M13 4v16"/></svg>`;
const ICON_LAYERS = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5"/><path d="m3 17 9 5 9-5"/></svg>`;
const ICON_PLUG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 2v6"/><path d="M15 2v6"/><path d="M7 8h10v3a5 5 0 0 1-5 5 5 5 0 0 1-5-5V8Z"/><path d="M12 16v6"/></svg>`;
const ICON_GRID = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>`;

export async function seed(knex: Knex): Promise<void> {
  // ── Limpieza de módulos legacy ───────────────────────────────
  // Cualquier módulo que NO esté en la lista blanca de top-levels
  // ("Administración", "APIs") se soft-deletea junto con sus submódulos.
  // Esto mantiene el sidebar limpio: sólo se ve lo que está en este seed
  // más lo que cree el admin desde el builder.
  await knex.raw(`
    UPDATE submodules
       SET deleted_at = SYSUTCDATETIME()
     WHERE deleted_at IS NULL
       AND module_id IN (
         SELECT id FROM modules
          WHERE name NOT IN (N'Administración', N'APIs') AND deleted_at IS NULL
       )
  `);
  await knex.raw(`
    UPDATE modules
       SET deleted_at = SYSUTCDATETIME()
     WHERE deleted_at IS NULL
       AND name NOT IN (N'Administración', N'APIs')
  `);

  // ── Módulo Administración ────────────────────────────────────
  await knex.raw(
    `
    MERGE modules AS target
    USING (SELECT N'Administración' AS name) AS src
    ON target.name = src.name AND target.deleted_at IS NULL
    WHEN MATCHED THEN UPDATE SET
      icon          = :icon,
      display_order = 1
    WHEN NOT MATCHED THEN
      INSERT (name, icon, display_order)
      VALUES (src.name, :icon, 1);
  `,
    { icon: ICON_SHIELD }
  );

  // ── Submódulos: 4 carpetas del front ─────────────────────────
  //   folder_key  →  carpeta dentro de src/modules en el front.
  //   path        →  ruta que abre la vista.
  //   El front mapea folder_key → React component (ver routes.config.tsx).
  const subs = [
    {
      name: 'Módulos',
      icon: ICON_BOX,
      path: '/administracion/modulos',
      folder: 'modules-and-submodules',
      order: 1
    },
    {
      name: 'Submódulos',
      icon: ICON_LAYERS,
      path: '/administracion/submodulos',
      folder: 'page-builder',
      order: 2
    },
    {
      name: 'Roles y permisos',
      icon: ICON_KEY,
      path: '/administracion/roles',
      folder: 'roles-and-permissions',
      order: 3
    },
    {
      name: 'Usuarios',
      icon: ICON_USER,
      path: '/administracion/usuarios',
      folder: 'users',
      order: 4
    },
    {
      name: 'Componentes',
      icon: ICON_PUZZLE,
      path: '/administracion/componentes',
      folder: 'components',
      order: 5
    },
    {
      name: 'Contenido del login',
      icon: ICON_PANEL,
      path: '/administracion/login',
      folder: 'login-content',
      order: 6
    }
  ];

  for (const s of subs) {
    await knex.raw(
      `
      DECLARE @admin_id INT = (
        SELECT id FROM modules WHERE name = N'Administración' AND deleted_at IS NULL
      );
      IF @admin_id IS NOT NULL
      BEGIN
        MERGE submodules AS target
        USING (
          SELECT @admin_id AS module_id, :folder AS folder_key
        ) AS src
        ON target.folder_key = src.folder_key AND target.deleted_at IS NULL
        WHEN MATCHED THEN UPDATE SET
          module_id     = src.module_id,
          name          = :name,
          icon          = :icon,
          path          = :path,
          display_order = :order_,
          deleted_at    = NULL
        WHEN NOT MATCHED THEN
          INSERT (module_id, name, icon, path, folder_key, display_order)
          VALUES (src.module_id, :name, :icon, :path, src.folder_key, :order_);
      END
      `,
      {
        folder: s.folder,
        name: s.name,
        icon: s.icon,
        path: s.path,
        order_: s.order
      }
    );
  }

  // ── Módulo APIs ──────────────────────────────────────────────
  // Top-level — al mismo nivel que "Administración", no adentro.
  // Por ahora contiene un solo submódulo (Google). Cuando se sumen
  // Microsoft / Slack / etc. van como nuevos submódulos del mismo módulo.
  await knex.raw(
    `
    MERGE modules AS target
    USING (SELECT N'APIs' AS name) AS src
    ON target.name = src.name AND target.deleted_at IS NULL
    WHEN MATCHED THEN UPDATE SET
      icon          = :icon,
      display_order = 2
    WHEN NOT MATCHED THEN
      INSERT (name, icon, display_order)
      VALUES (src.name, :icon, 2);
  `,
    { icon: ICON_PLUG }
  );

  // Submódulos del módulo APIs — UNO POR CADA API individual.
  // Cuando se sumen Drive / Calendar / Gmail / Microsoft / etc. van
  // como entradas separadas del sidebar, NO agrupadas por proveedor.
  // (La cuenta de Google se conecta una sola vez y vale para todas
  // las APIs de Google del tester — la conexión se hace dentro de
  // cada tester.)
  // Cada API es UN MÓDULO frontend independiente (google-sheets,
  // google-drive, google-calendar, …) — folder_key coincide con la
  // carpeta del módulo en src/modules/.
  const apiSubs = [
    {
      name: 'Hoja de cálculo',
      icon: ICON_GRID,
      path: '/google/sheets',
      folder: 'google-sheets',
      order: 1
    },
    {
      name: 'Drive',
      icon: ICON_BOX,
      path: '/google/drive',
      folder: 'google-drive',
      order: 2
    },
    {
      name: 'Calendario',
      icon: ICON_LAYERS,
      path: '/google/calendar',
      folder: 'google-calendar',
      order: 3
    },
    {
      name: 'Gmail',
      icon: ICON_PANEL,
      path: '/google/gmail',
      folder: 'google-gmail',
      order: 4
    },
    {
      name: 'Documentos',
      icon: ICON_PANEL,
      path: '/google/docs',
      folder: 'google-docs',
      order: 5
    },
    {
      name: 'Tareas',
      icon: ICON_PUZZLE,
      path: '/google/tasks',
      folder: 'google-tasks',
      order: 6
    },
    {
      name: 'Meet',
      icon: ICON_PLUG,
      path: '/google/meet',
      folder: 'google-meet',
      order: 7
    }
  ];
  for (const s of apiSubs) {
    await knex.raw(
      `
      DECLARE @apis_id INT = (
        SELECT id FROM modules WHERE name = N'APIs' AND deleted_at IS NULL
      );
      IF @apis_id IS NOT NULL
      BEGIN
        MERGE submodules AS target
        USING (SELECT @apis_id AS module_id, :folder AS folder_key) AS src
        ON target.folder_key = src.folder_key AND target.deleted_at IS NULL
        WHEN MATCHED THEN UPDATE SET
          module_id     = src.module_id,
          name          = :name,
          icon          = :icon,
          path          = :path,
          display_order = :order_,
          deleted_at    = NULL
        WHEN NOT MATCHED THEN
          INSERT (module_id, name, icon, path, folder_key, display_order)
          VALUES (src.module_id, :name, :icon, :path, src.folder_key, :order_);
      END
      `,
      {
        folder: s.folder,
        name: s.name,
        icon: s.icon,
        path: s.path,
        order_: s.order
      }
    );
  }

  // Limpieza: versiones viejas que ya no van.
  await knex.raw(`
    UPDATE submodules SET deleted_at = SYSUTCDATETIME()
     WHERE folder_key IN (N'apis', N'apis-google', N'apis-sheets')
       AND deleted_at IS NULL
  `);
}
