import { preferencesFromDTO } from '../dtos/preferences.dto.js';

export function getPreferences({ repository }) {
  return async () => {
    const dto = await repository.get();
    return preferencesFromDTO(dto);
  };
}
