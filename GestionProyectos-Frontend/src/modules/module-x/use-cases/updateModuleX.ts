import { toUpdateDto } from '../dtos/update-module-x.dto';

export const updateModuleX = ({ repository }) => (id, input) => repository.update(id, toUpdateDto(input));
