import { toUpdateDto } from '../dtos/update-modulo-demo.dto';

export const updateModuloDemo = ({ repository }) => (id, input) => repository.update(id, toUpdateDto(input));
