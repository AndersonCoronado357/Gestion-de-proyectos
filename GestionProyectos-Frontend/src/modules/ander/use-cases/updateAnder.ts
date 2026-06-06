import { toUpdateDto } from '../dtos/update-ander.dto';

export const updateAnder = ({ repository }) => (id, input) => repository.update(id, toUpdateDto(input));
