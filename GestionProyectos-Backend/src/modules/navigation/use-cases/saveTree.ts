// Use case: persistir el árbol completo enviado por el front.
// Pensado para PUT /api/navigation/tree.
//
// Tras guardar, broadcasteamos sólo el árbol al canal 'navigation' para
// que todos los clientes refresquen el sidebar.  El `idMap` se devuelve
// únicamente al cliente que originó el save (los otros no lo necesitan).

import type {
  NavigationTreeInput,
  SaveTreeResult
} from '../domain/navigation.types';
import type { NavigationRepositoryPort } from '../ports/navigation.repository';
import { realtime } from '../../../shared/realtime/adapters/sse.adapter';

interface Deps {
  navigationRepository: NavigationRepositoryPort;
}

module.exports =
  ({ navigationRepository }: Deps) =>
  async ({ tree }: { tree: NavigationTreeInput }): Promise<SaveTreeResult> => {
    const result = await navigationRepository.saveTree(tree);
    realtime.broadcast('navigation', {
      type: 'tree-updated',
      tree: result.tree
    });
    return result;
  };
