import { toCreateDto } from '../dtos/create-module-x.dto';

export const createModuleX = ({ repository }) => (input) => repository.create(toCreateDto(input));
