import { toCreateDto } from '../dtos/create-home.dto';

export const createHome = ({ repository }) => (input) => repository.create(toCreateDto(input));
