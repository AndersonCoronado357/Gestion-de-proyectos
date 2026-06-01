// Implementación Knex (SQL Server) del PreferencesRepository.
//
// Estrategia simple: el JSON completo va en `overrides`. `ui_theme_id`
// apunta siempre al tema 'default' (existe gracias al seed).

import type { Knex } from 'knex';
import type { UiPreferences } from '../../domain/preferences.types';
import type { PreferencesRepositoryPort } from '../../ports/preferences.repository';

const PreferencesRepository = require('../../ports/preferences.repository');

interface UserUiThemeRow {
  id: number;
  user_id: number;
  ui_theme_id: number;
  overrides: string | null;
}

class PreferencesRepositoryImpl
  extends PreferencesRepository
  implements PreferencesRepositoryPort
{
  private db: Knex;
  private table = 'user_ui_themes';

  constructor(db: Knex) {
    super();
    this.db = db;
  }

  async findByUserId(userId: number): Promise<UiPreferences | null> {
    const row = await this.db<UserUiThemeRow>(this.table)
      .where({ user_id: userId })
      .first();
    if (!row || !row.overrides) return null;
    try {
      return JSON.parse(row.overrides) as UiPreferences;
    } catch {
      // Si el JSON está corrupto, devolvemos null y dejamos que el caller
      // use defaults — mejor que tirar 500.
      return null;
    }
  }

  // SQL Server: MERGE atómico para evitar la carrera "el row no existía,
  // dos requests intentan INSERT al mismo tiempo".
  async upsert(userId: number, prefs: UiPreferences): Promise<UiPreferences> {
    const themeRow = await this.db<{ id: number }>('ui_themes')
      .where({ name: 'default' })
      .first();
    const defaultThemeId = themeRow?.id ?? null;
    if (defaultThemeId === null) {
      throw new Error("ui_themes 'default' no existe — ejecuta el seed inicial");
    }

    const overrides = JSON.stringify(prefs);
    await this.db.raw(
      `
      MERGE user_ui_themes AS target
      USING (SELECT :userId AS user_id, :themeId AS ui_theme_id, :overrides AS overrides) AS src
      ON target.user_id = src.user_id
      WHEN MATCHED THEN UPDATE SET
        ui_theme_id = src.ui_theme_id,
        overrides   = src.overrides,
        updated_at  = SYSUTCDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (user_id, ui_theme_id, overrides)
        VALUES (src.user_id, src.ui_theme_id, src.overrides);
      `,
      { userId, themeId: defaultThemeId, overrides }
    );

    return prefs;
  }
}

module.exports = PreferencesRepositoryImpl;
module.exports.default = PreferencesRepositoryImpl;
