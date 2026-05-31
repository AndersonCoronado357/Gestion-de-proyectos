import { toUpdateDto } from '../dtos/update-user.dto';

export const updateUser = ({ repository }) => (input) =>
  repository.update(toUpdateDto(input));
