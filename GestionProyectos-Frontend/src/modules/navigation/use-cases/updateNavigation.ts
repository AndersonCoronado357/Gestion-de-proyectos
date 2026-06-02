import { toUpdateDto } from '../dtos/update-navigation.dto';

export const updateNavigation = ({ repository }) => (id, input) => repository.update(id, toUpdateDto(input));
