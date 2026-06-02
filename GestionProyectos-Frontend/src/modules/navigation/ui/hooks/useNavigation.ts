import { useMemo } from 'react';
import { buildNavigationApi } from '../../adapters/entry/navigation.api.js';
import { getNavigationList } from '../../use-cases/getNavigationList.js';
import { getNavigationById } from '../../use-cases/getNavigationById.js';
import { createNavigation } from '../../use-cases/createNavigation.js';
import { updateNavigation } from '../../use-cases/updateNavigation.js';
import { deleteNavigation } from '../../use-cases/deleteNavigation.js';

export interface UseNavigationOptions {
  token?: string;
}

export function useNavigation({ token }: UseNavigationOptions = {}) {
  return useMemo(() => {
    const repository = buildNavigationApi({ token });
    return {
      list: getNavigationList({ repository }),
      getById: getNavigationById({ repository }),
      create: createNavigation({ repository }),
      update: updateNavigation({ repository }),
      remove: deleteNavigation({ repository })
    };
  }, [token]);
}
