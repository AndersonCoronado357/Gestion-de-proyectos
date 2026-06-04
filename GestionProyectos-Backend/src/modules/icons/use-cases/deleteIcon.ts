// Borra un icono. Si está siendo usado por algún submódulo, devuelve el
// conteo y NO borra — el controller responde 409.

import type { IconRepositoryPort } from '../ports/icon.repository';

interface Deps {
  iconRepository: IconRepositoryPort;
}

module.exports =
  ({ iconRepository }: Deps) =>
  async ({ id }: { id: number }): Promise<{ deleted: boolean; usageCount: number }> => {
    return iconRepository.delete(id);
  };
