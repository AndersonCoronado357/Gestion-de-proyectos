import { toCreateDto } from '../dtos/create-prueba.dto';

export const createPrueba = ({ repository }) => (input) => repository.create(toCreateDto(input));
