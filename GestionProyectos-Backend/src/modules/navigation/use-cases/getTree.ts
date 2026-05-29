// Use case: traer el árbol completo de módulos/submódulos.
// Pensado para GET /api/navigation/tree.

import type { NavigationTree } from '../domain/navigation.types';
import type { NavigationRepositoryPort } from '../ports/navigation.repository';

interface Deps {
  navigationRepository: NavigationRepositoryPort;
}

module.exports =
  ({ navigationRepository }: Deps) =>
  async (): Promise<NavigationTree> => {
    return navigationRepository.getTree();
  };
