import { createUser } from '../../use-cases/createUser';
import { updateUser } from '../../use-cases/updateUser';
import { deleteUser } from '../../use-cases/deleteUser';
import { getUsersList } from '../../use-cases/getUsersList';
import { getUserById } from '../../use-cases/getUserById';

export const buildUsersApi = ({ repository }) => ({
  list: getUsersList({ repository }),
  getById: getUserById({ repository }),
  create: createUser({ repository }),
  update: updateUser({ repository }),
  remove: deleteUser({ repository })
});
