import { preferencesToDTO } from '../dtos/preferences.dto.js';

export function updatePreferences({ repository }) {
  return async (prefs) => {
    await repository.save(preferencesToDTO(prefs));
    return prefs;
  };
}
