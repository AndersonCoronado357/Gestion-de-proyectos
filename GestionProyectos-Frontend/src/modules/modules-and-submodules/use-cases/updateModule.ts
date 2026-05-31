import { toUpdateDto } from '../dtos/update-module.dto';

export const updateModule = ({ repository }) => (input) =>
  repository.update(toUpdateDto(input));
