import { toCreateDto } from '../dtos/create-anderson4.dto';

export const createAnderson4 = ({ repository }) => (input) => repository.create(toCreateDto(input));
