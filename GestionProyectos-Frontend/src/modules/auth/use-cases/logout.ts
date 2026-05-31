import type { AuthRepository } from '../ports/auth.repository.js';

export const logout =
  ({ repository }: { repository: AuthRepository }) =>
  (): Promise<void> =>
    repository.logout();
