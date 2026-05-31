import { toCreateDto } from '../dtos/create-user.dto';

export const createUser = ({ repository }) => (input) =>
  repository.create(toCreateDto(input));
