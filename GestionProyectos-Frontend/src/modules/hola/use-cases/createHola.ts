import { toCreateDto } from '../dtos/create-hola.dto';

export const createHola = ({ repository }) => (input) => repository.create(toCreateDto(input));
