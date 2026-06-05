import type { DesignView, CreateViewInput } from '../domain/design.types';
import type { DesignRepositoryPort } from '../ports/design.repository';

interface Deps {
  designRepository: DesignRepositoryPort;
}

module.exports =
  ({ designRepository }: Deps) =>
  async (input: CreateViewInput): Promise<DesignView> => {
    return designRepository.createView({
      projectId: input.projectId,
      name: input.name?.trim() || undefined
    });
  };
