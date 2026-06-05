import type { DesignProject, UpdateProjectInput } from '../domain/design.types';
import type { DesignRepositoryPort } from '../ports/design.repository';

interface Deps {
  designRepository: DesignRepositoryPort;
}

module.exports =
  ({ designRepository }: Deps) =>
  async (id: number, input: UpdateProjectInput): Promise<DesignProject | null> => {
    if (input.name !== undefined) {
      const name = input.name.trim();
      if (!name) {
        const err: Error & { code?: string } = new Error('El nombre no puede estar vacío');
        err.code = 'INVALID_NAME';
        throw err;
      }
      input.name = name;
    }
    return designRepository.updateProject(id, input);
  };
