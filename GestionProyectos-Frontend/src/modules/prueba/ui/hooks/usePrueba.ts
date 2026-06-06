import { useMemo } from 'react';
import { buildPruebaApi } from '../../adapters/entry/prueba.api.js';
import { getPruebaList } from '../../use-cases/getPruebaList.js';
import { getPruebaById } from '../../use-cases/getPruebaById.js';
import { createPrueba } from '../../use-cases/createPrueba.js';
import { updatePrueba } from '../../use-cases/updatePrueba.js';
import { deletePrueba } from '../../use-cases/deletePrueba.js';

export interface UsePruebaOptions {
  token?: string;
}

export function usePrueba({ token }: UsePruebaOptions = {}) {
  return useMemo(() => {
    const repository = buildPruebaApi({ token });
    return {
      list: getPruebaList({ repository }),
      getById: getPruebaById({ repository }),
      create: createPrueba({ repository }),
      update: updatePrueba({ repository }),
      remove: deletePrueba({ repository })
    };
  }, [token]);
}
