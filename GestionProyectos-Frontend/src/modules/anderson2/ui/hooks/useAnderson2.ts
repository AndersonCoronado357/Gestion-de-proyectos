import { useMemo } from 'react';
import { buildAnderson2Api } from '../../adapters/entry/anderson2.api.js';
import { getAnderson2List } from '../../use-cases/getAnderson2List.js';
import { getAnderson2ById } from '../../use-cases/getAnderson2ById.js';
import { createAnderson2 } from '../../use-cases/createAnderson2.js';
import { updateAnderson2 } from '../../use-cases/updateAnderson2.js';
import { deleteAnderson2 } from '../../use-cases/deleteAnderson2.js';

export interface UseAnderson2Options {
  token?: string;
}

export function useAnderson2({ token }: UseAnderson2Options = {}) {
  return useMemo(() => {
    const repository = buildAnderson2Api({ token });
    return {
      list: getAnderson2List({ repository }),
      getById: getAnderson2ById({ repository }),
      create: createAnderson2({ repository }),
      update: updateAnderson2({ repository }),
      remove: deleteAnderson2({ repository })
    };
  }, [token]);
}
