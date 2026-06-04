import type { IconRow } from '../domain/icon.types';
import type { IconRepositoryPort } from '../ports/icon.repository';

interface Deps {
  iconRepository: IconRepositoryPort;
}

module.exports =
  ({ iconRepository }: Deps) =>
  async ({
    id,
    displayName
  }: {
    id: number;
    displayName: string | null;
  }): Promise<IconRow | null> => {
    return iconRepository.rename(id, displayName);
  };
