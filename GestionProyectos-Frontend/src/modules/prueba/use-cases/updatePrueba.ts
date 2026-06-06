import { toUpdateDto } from '../dtos/update-prueba.dto';

export const updatePrueba = ({ repository }) => (id, input) => repository.update(id, toUpdateDto(input));
