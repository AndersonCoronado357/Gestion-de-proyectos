// Port del PreferencesRepository.
//
// `user_ui_themes` guarda 1 fila por usuario apuntando a un tema base
// (`ui_theme_id`) + un JSON `overrides` con los cambios personales.
// Para nuestro caso simple, guardamos todo el shape en `overrides`.

import type { UiPreferences } from '../domain/preferences.types';

export interface PreferencesRepositoryPort {
  findByUserId(userId: number): Promise<UiPreferences | null>;
  upsert(userId: number, prefs: UiPreferences): Promise<UiPreferences>;
}

class PreferencesRepository implements PreferencesRepositoryPort {
  async findByUserId(_userId: number): Promise<UiPreferences | null> {
    throw new Error('Not implemented');
  }
  async upsert(_userId: number, _prefs: UiPreferences): Promise<UiPreferences> {
    throw new Error('Not implemented');
  }
}

module.exports = PreferencesRepository;
module.exports.default = PreferencesRepository;
