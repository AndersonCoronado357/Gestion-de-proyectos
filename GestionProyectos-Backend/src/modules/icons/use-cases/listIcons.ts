import type { IconListFilters, IconListResult } from '../domain/icon.types';
import type { IconRepositoryPort } from '../ports/icon.repository';

interface Deps {
  iconRepository: IconRepositoryPort;
}

module.exports =
  ({ iconRepository }: Deps) =>
  async (filters: IconListFilters): Promise<IconListResult> => {
    return iconRepository.list(filters);
  };
