import { toCreateDto } from '../dtos/create-anderson.dto';

export const createAnderson = ({ repository }) => (input) => repository.create(toCreateDto(input));
