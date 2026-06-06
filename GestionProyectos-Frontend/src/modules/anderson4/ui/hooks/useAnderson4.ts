import { useMemo } from 'react';
import { buildAnderson4Api } from '../../adapters/entry/anderson4.api.js';
import { getAnderson4List } from '../../use-cases/getAnderson4List.js';
import { getAnderson4ById } from '../../use-cases/getAnderson4ById.js';
import { createAnderson4 } from '../../use-cases/createAnderson4.js';
import { updateAnderson4 } from '../../use-cases/updateAnderson4.js';
import { deleteAnderson4 } from '../../use-cases/deleteAnderson4.js';

export interface UseAnderson4Options {
  token?: string;
}

export function useAnderson4({ token }: UseAnderson4Options = {}) {
  return useMemo(() => {
    const repository = buildAnderson4Api({ token });
    return {
      list: getAnderson4List({ repository }),
      getById: getAnderson4ById({ repository }),
      create: createAnderson4({ repository }),
      update: updateAnderson4({ repository }),
      remove: deleteAnderson4({ repository })
    };
  }, [token]);
}
