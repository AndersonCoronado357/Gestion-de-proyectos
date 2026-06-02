import { toUpdateDto } from '../dtos/update-login-content.dto';

export const updateLoginContent = ({ repository }) => (id, input) => repository.update(id, toUpdateDto(input));
