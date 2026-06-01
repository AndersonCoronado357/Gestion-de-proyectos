import { toUpdateDto } from '../dtos/update-test-runner.dto';

export const updateTestRunner = ({ repository }) => (id, input) => repository.update(id, toUpdateDto(input));
