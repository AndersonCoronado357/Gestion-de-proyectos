// Use case: actualizar (upsert) las preferencias del usuario actual.

import type { UiPreferences } from '../domain/preferences.types';
import type { PreferencesRepositoryPort } from '../ports/preferences.repository';

interface Deps {
  preferencesRepository: PreferencesRepositoryPort;
}

interface Input {
  userId: number;
  preferences: UiPreferences;
}

module.exports =
  ({ preferencesRepository }: Deps) =>
  async ({ userId, preferences }: Input): Promise<UiPreferences> => {
    return preferencesRepository.upsert(userId, preferences);
  };
