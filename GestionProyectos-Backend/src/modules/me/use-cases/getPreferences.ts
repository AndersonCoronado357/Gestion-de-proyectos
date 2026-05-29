// Use case: traer las preferencias del usuario actual.
// Si no tiene fila guardada, devolvemos defaults.

import {
  DEFAULT_PREFERENCES,
  type UiPreferences
} from '../domain/preferences.types';
import type { PreferencesRepositoryPort } from '../ports/preferences.repository';

interface Deps {
  preferencesRepository: PreferencesRepositoryPort;
}

module.exports =
  ({ preferencesRepository }: Deps) =>
  async ({ userId }: { userId: number }): Promise<UiPreferences> => {
    const found = await preferencesRepository.findByUserId(userId);
    return found ?? DEFAULT_PREFERENCES;
  };
