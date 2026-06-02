import { toCreateDto } from '../dtos/create-login-content.dto';

export const createLoginContent = ({ repository }) => (input) => repository.create(toCreateDto(input));
