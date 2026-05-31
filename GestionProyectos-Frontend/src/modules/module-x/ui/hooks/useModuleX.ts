import { useMemo } from 'react';
import { buildModuleXApi } from '../../adapters/entry/module-x.api.js';
import { getModuleXList } from '../../use-cases/getModuleXList.js';
import { getModuleXById } from '../../use-cases/getModuleXById.js';
import { createModuleX } from '../../use-cases/createModuleX.js';
import { updateModuleX } from '../../use-cases/updateModuleX.js';
import { deleteModuleX } from '../../use-cases/deleteModuleX.js';

export interface UseModuleXOptions {
  token?: string;
}

export function useModuleX({ token }: UseModuleXOptions = {}) {
  return useMemo(() => {
    const repository = buildModuleXApi({ token });
    return {
      list: getModuleXList({ repository }),
      getById: getModuleXById({ repository }),
      create: createModuleX({ repository }),
      update: updateModuleX({ repository }),
      remove: deleteModuleX({ repository })
    };
  }, [token]);
}
