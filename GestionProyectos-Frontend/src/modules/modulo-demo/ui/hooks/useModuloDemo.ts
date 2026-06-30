import { useMemo } from 'react';
import { buildModuloDemoApi } from '../../adapters/entry/modulo-demo.api.js';
import { getModuloDemoList } from '../../use-cases/getModuloDemoList.js';
import { getModuloDemoById } from '../../use-cases/getModuloDemoById.js';
import { createModuloDemo } from '../../use-cases/createModuloDemo.js';
import { updateModuloDemo } from '../../use-cases/updateModuloDemo.js';
import { deleteModuloDemo } from '../../use-cases/deleteModuloDemo.js';

export interface UseModuloDemoOptions {
  token?: string;
}

export function useModuloDemo({ token }: UseModuloDemoOptions = {}) {
  return useMemo(() => {
    const repository = buildModuloDemoApi({ token });
    return {
      list: getModuloDemoList({ repository }),
      getById: getModuloDemoById({ repository }),
      create: createModuloDemo({ repository }),
      update: updateModuloDemo({ repository }),
      remove: deleteModuloDemo({ repository })
    };
  }, [token]);
}
