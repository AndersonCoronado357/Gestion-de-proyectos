import { toUpdateDto } from '../dtos/update-try.dto';

export const updateTry = ({ repository }) => (id, input) => repository.update(id, toUpdateDto(input));
