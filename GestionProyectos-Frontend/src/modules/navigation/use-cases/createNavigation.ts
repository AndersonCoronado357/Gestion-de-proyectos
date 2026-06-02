import { toCreateDto } from '../dtos/create-navigation.dto';

export const createNavigation = ({ repository }) => (input) => repository.create(toCreateDto(input));
