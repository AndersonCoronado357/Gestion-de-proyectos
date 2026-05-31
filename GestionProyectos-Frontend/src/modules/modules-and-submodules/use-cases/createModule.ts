import { toCreateDto } from '../dtos/create-module.dto';

export const createModule = ({ repository }) => (input) =>
  repository.create(toCreateDto(input));
