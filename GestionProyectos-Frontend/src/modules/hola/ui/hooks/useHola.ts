import { useMemo } from 'react';
import { buildHolaApi } from '../../adapters/entry/hola.api.js';
import { getHolaList } from '../../use-cases/getHolaList.js';
import { getHolaById } from '../../use-cases/getHolaById.js';
import { createHola } from '../../use-cases/createHola.js';
import { updateHola } from '../../use-cases/updateHola.js';
import { deleteHola } from '../../use-cases/deleteHola.js';

export interface UseHolaOptions {
  token?: string;
}

export function useHola({ token }: UseHolaOptions = {}) {
  return useMemo(() => {
    const repository = buildHolaApi({ token });
    return {
      list: getHolaList({ repository }),
      getById: getHolaById({ repository }),
      create: createHola({ repository }),
      update: updateHola({ repository }),
      remove: deleteHola({ repository })
    };
  }, [token]);
}
