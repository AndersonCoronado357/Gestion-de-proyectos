import { toCreateDto } from '../dtos/create-page-builder.dto';

export const createPageBuilder = ({ repository }) => (input) => repository.create(toCreateDto(input));
