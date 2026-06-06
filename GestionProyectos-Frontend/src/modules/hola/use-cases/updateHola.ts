import { toUpdateDto } from '../dtos/update-hola.dto';

export const updateHola = ({ repository }) => (id, input) => repository.update(id, toUpdateDto(input));
