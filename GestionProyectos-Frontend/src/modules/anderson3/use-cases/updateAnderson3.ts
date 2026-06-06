import { toUpdateDto } from '../dtos/update-anderson3.dto';

export const updateAnderson3 = ({ repository }) => (id, input) => repository.update(id, toUpdateDto(input));
