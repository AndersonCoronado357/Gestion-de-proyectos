import { toUpdateDto } from '../dtos/update-preferences.dto';

export const updatePreferences = ({ repository }) => (id, input) => repository.update(id, toUpdateDto(input));
