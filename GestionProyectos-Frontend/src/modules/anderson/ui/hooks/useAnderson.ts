import { useMemo } from 'react';
import { buildAndersonApi } from '../../adapters/entry/anderson.api.js';
import { getAndersonList } from '../../use-cases/getAndersonList.js';
import { getAndersonById } from '../../use-cases/getAndersonById.js';
import { createAnderson } from '../../use-cases/createAnderson.js';
import { updateAnderson } from '../../use-cases/updateAnderson.js';
import { deleteAnderson } from '../../use-cases/deleteAnderson.js';

export interface UseAndersonOptions {
  token?: string;
}

export function useAnderson({ token }: UseAndersonOptions = {}) {
  return useMemo(() => {
    const repository = buildAndersonApi({ token });
    return {
      list: getAndersonList({ repository }),
      getById: getAndersonById({ repository }),
      create: createAnderson({ repository }),
      update: updateAnderson({ repository }),
      remove: deleteAnderson({ repository })
    };
  }, [token]);
}
