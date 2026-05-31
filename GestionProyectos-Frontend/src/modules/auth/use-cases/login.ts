import type { AuthRepository } from '../ports/auth.repository.js';
import type { LoginResponse } from '../domain/token.entity.js';
import { toLoginDto, type LoginInput } from '../dtos/login.dto.js';

export const login =
  ({ repository }: { repository: AuthRepository }) =>
  (input: LoginInput): Promise<LoginResponse> =>
    repository.login(toLoginDto(input));
