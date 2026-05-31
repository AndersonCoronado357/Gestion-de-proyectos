import type { AuthRepository } from '../ports/auth.repository.js';
import type { AccessTokenData } from '../domain/token.entity.js';

export const refreshToken =
  ({ repository }: { repository: AuthRepository }) =>
  (): Promise<AccessTokenData> =>
    repository.refresh();
