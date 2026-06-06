import { toCreateDto } from '../dtos/create-anderson3.dto';

export const createAnderson3 = ({ repository }) => (input) => repository.create(toCreateDto(input));
