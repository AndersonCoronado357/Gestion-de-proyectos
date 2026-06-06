import { useMemo } from 'react';
import { buildTryApi } from '../../adapters/entry/try.api.js';
import { getTryList } from '../../use-cases/getTryList.js';
import { getTryById } from '../../use-cases/getTryById.js';
import { createTry } from '../../use-cases/createTry.js';
import { updateTry } from '../../use-cases/updateTry.js';
import { deleteTry } from '../../use-cases/deleteTry.js';

export interface UseTryOptions {
  token?: string;
}

export function useTry({ token }: UseTryOptions = {}) {
  return useMemo(() => {
    const repository = buildTryApi({ token });
    return {
      list: getTryList({ repository }),
      getById: getTryById({ repository }),
      create: createTry({ repository }),
      update: updateTry({ repository }),
      remove: deleteTry({ repository })
    };
  }, [token]);
}
