import { toCreateDto } from '../dtos/create-anderson2.dto';

export const createAnderson2 = ({ repository }) => (input) => repository.create(toCreateDto(input));
