import { toUpdateDto } from '../dtos/update-role.dto';

export const updateRole = ({ repository }) => (input) =>
  repository.update(toUpdateDto(input));
