import { toCreateDto } from '../dtos/create-test-runner.dto';

export const createTestRunner = ({ repository }) => (input) => repository.create(toCreateDto(input));
