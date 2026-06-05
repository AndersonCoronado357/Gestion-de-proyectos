import type { DesignProject, CreateProjectInput } from '../domain/design.types';
import type { DesignRepositoryPort } from '../ports/design.repository';

interface Deps {
  designRepository: DesignRepositoryPort;
}

module.exports =
  ({ designRepository }: Deps) =>
  async (input: CreateProjectInput): Promise<DesignProject> => {
    const name = (input.name || '').trim();
    if (!name) {
      const err: Error & { code?: string } = new Error('El nombre no puede estar vacío');
      err.code = 'INVALID_NAME';
      throw err;
    }
    return designRepository.createProject({ name, createdBy: input.createdBy ?? null });
  };
