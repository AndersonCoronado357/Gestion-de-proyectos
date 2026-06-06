import { useMemo } from 'react';
import { buildAnderApi } from '../../adapters/entry/ander.api.js';
import { getAnderList } from '../../use-cases/getAnderList.js';
import { getAnderById } from '../../use-cases/getAnderById.js';
import { createAnder } from '../../use-cases/createAnder.js';
import { updateAnder } from '../../use-cases/updateAnder.js';
import { deleteAnder } from '../../use-cases/deleteAnder.js';

export interface UseAnderOptions {
  token?: string;
}

export function useAnder({ token }: UseAnderOptions = {}) {
  return useMemo(() => {
    const repository = buildAnderApi({ token });
    return {
      list: getAnderList({ repository }),
      getById: getAnderById({ repository }),
      create: createAnder({ repository }),
      update: updateAnder({ repository }),
      remove: deleteAnder({ repository })
    };
  }, [token]);
}
