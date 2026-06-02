import { useMemo } from 'react';
import { buildPreferencesApi } from '../../adapters/entry/preferences.api.js';
import { getPreferencesList } from '../../use-cases/getPreferencesList.js';
import { getPreferencesById } from '../../use-cases/getPreferencesById.js';
import { createPreferences } from '../../use-cases/createPreferences.js';
import { updatePreferences } from '../../use-cases/updatePreferences.js';
import { deletePreferences } from '../../use-cases/deletePreferences.js';

export interface UsePreferencesOptions {
  token?: string;
}

export function usePreferences({ token }: UsePreferencesOptions = {}) {
  return useMemo(() => {
    const repository = buildPreferencesApi({ token });
    return {
      list: getPreferencesList({ repository }),
      getById: getPreferencesById({ repository }),
      create: createPreferences({ repository }),
      update: updatePreferences({ repository }),
      remove: deletePreferences({ repository })
    };
  }, [token]);
}
