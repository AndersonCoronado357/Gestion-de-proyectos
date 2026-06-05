import type { DesignView, UpdateViewInput } from '../domain/design.types';
import type { DesignRepositoryPort } from '../ports/design.repository';

interface Deps {
  designRepository: DesignRepositoryPort;
}

module.exports =
  ({ designRepository }: Deps) =>
  async (id: number, input: UpdateViewInput): Promise<DesignView | null> => {
    if (input.name !== undefined) {
      const n = input.name.trim();
      if (!n) {
        const err: Error & { code?: string } = new Error('El nombre no puede estar vacío');
        err.code = 'INVALID_NAME';
        throw err;
      }
      input.name = n;
    }
    return designRepository.updateView(id, input);
  };
