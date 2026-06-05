import type { DesignRepositoryPort } from '../ports/design.repository';

interface Deps {
  designRepository: DesignRepositoryPort;
}

module.exports =
  ({ designRepository }: Deps) =>
  async (id: number): Promise<boolean> => {
    return designRepository.deleteProject(id);
  };
