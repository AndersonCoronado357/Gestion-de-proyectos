import { toUpdateDto } from '../dtos/update-anderson.dto';

export const updateAnderson = ({ repository }) => (id, input) => repository.update(id, toUpdateDto(input));
