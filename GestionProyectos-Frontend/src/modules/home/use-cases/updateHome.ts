import { toUpdateDto } from '../dtos/update-home.dto';

export const updateHome = ({ repository }) => (id, input) => repository.update(id, toUpdateDto(input));
