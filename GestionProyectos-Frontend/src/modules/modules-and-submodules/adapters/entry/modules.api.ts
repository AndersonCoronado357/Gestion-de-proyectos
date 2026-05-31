import { createModule } from '../../use-cases/createModule';
import { updateModule } from '../../use-cases/updateModule';
import { deleteModule } from '../../use-cases/deleteModule';
import { getModulesList } from '../../use-cases/getModulesList';
import { getModuleById } from '../../use-cases/getModuleById';

export const buildModulesApi = ({ repository }) => ({
  list: getModulesList({ repository }),
  getById: getModuleById({ repository }),
  create: createModule({ repository }),
  update: updateModule({ repository }),
  remove: deleteModule({ repository })
});
