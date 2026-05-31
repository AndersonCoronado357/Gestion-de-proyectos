import { toCreateDto } from '../dtos/create-role.dto';

export const createRole = ({ repository }) => (input) =>
  repository.create(toCreateDto(input));
