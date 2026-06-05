import type { DesignProject } from '../domain/design.types';
import type { DesignRepositoryPort } from '../ports/design.repository';

interface Deps {
  designRepository: DesignRepositoryPort;
}

module.exports =
  ({ designRepository }: Deps) =>
  async (): Promise<DesignProject[]> => {
    return designRepository.listProjects();
  };
