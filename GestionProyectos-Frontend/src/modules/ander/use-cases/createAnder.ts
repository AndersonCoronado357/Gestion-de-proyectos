import { toCreateDto } from '../dtos/create-ander.dto';

export const createAnder = ({ repository }) => (input) => repository.create(toCreateDto(input));
