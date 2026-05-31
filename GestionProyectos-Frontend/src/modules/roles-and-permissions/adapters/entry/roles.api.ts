import { createRole } from '../../use-cases/createRole';
import { updateRole } from '../../use-cases/updateRole';
import { deleteRole } from '../../use-cases/deleteRole';
import { getRolesList } from '../../use-cases/getRolesList';
import { getRoleById } from '../../use-cases/getRoleById';

export const buildRolesApi = ({ repository }) => ({
  list: getRolesList({ repository }),
  getById: getRoleById({ repository }),
  create: createRole({ repository }),
  update: updateRole({ repository }),
  remove: deleteRole({ repository })
});
