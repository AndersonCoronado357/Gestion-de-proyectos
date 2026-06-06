import { toUpdateDto } from '../dtos/update-anderson2.dto';

export const updateAnderson2 = ({ repository }) => (id, input) => repository.update(id, toUpdateDto(input));
