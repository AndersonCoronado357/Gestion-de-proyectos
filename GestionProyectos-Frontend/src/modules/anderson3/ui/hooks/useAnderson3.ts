import { useMemo } from 'react';
import { buildAnderson3Api } from '../../adapters/entry/anderson3.api.js';
import { getAnderson3List } from '../../use-cases/getAnderson3List.js';
import { getAnderson3ById } from '../../use-cases/getAnderson3ById.js';
import { createAnderson3 } from '../../use-cases/createAnderson3.js';
import { updateAnderson3 } from '../../use-cases/updateAnderson3.js';
import { deleteAnderson3 } from '../../use-cases/deleteAnderson3.js';

export interface UseAnderson3Options {
  token?: string;
}

export function useAnderson3({ token }: UseAnderson3Options = {}) {
  return useMemo(() => {
    const repository = buildAnderson3Api({ token });
    return {
      list: getAnderson3List({ repository }),
      getById: getAnderson3ById({ repository }),
      create: createAnderson3({ repository }),
      update: updateAnderson3({ repository }),
      remove: deleteAnderson3({ repository })
    };
  }, [token]);
}
