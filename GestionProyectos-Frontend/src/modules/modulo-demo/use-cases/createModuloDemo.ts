import { toCreateDto } from '../dtos/create-modulo-demo.dto';

export const createModuloDemo = ({ repository }) => (input) => repository.create(toCreateDto(input));
