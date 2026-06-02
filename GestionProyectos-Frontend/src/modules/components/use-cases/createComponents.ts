import { toCreateDto } from '../dtos/create-components.dto';

export const createComponents = ({ repository }) => (input) => repository.create(toCreateDto(input));
