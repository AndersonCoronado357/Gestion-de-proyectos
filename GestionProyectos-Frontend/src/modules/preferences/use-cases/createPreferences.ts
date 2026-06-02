import { toCreateDto } from '../dtos/create-preferences.dto';

export const createPreferences = ({ repository }) => (input) => repository.create(toCreateDto(input));
