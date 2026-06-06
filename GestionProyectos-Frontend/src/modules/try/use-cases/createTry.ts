import { toCreateDto } from '../dtos/create-try.dto';

export const createTry = ({ repository }) => (input) => repository.create(toCreateDto(input));
