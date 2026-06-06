import { toUpdateDto } from '../dtos/update-anderson4.dto';

export const updateAnderson4 = ({ repository }) => (id, input) => repository.update(id, toUpdateDto(input));
