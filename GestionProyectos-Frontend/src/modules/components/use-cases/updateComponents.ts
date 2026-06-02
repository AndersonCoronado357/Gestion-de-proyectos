import { toUpdateDto } from '../dtos/update-components.dto';

export const updateComponents = ({ repository }) => (id, input) => repository.update(id, toUpdateDto(input));
