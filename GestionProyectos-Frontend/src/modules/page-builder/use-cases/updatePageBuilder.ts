import { toUpdateDto } from '../dtos/update-page-builder.dto';

export const updatePageBuilder = ({ repository }) => (id, input) => repository.update(id, toUpdateDto(input));
