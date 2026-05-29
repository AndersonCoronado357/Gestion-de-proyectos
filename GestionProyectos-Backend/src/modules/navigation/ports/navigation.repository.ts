// Port del NavigationRepository.

import type {
  NavigationTree,
  NavigationTreeInput,
  SaveTreeResult
} from '../domain/navigation.types';

export interface NavigationRepositoryPort {
  getTree(): Promise<NavigationTree>;
  // Reemplaza atómicamente el árbol con el payload.  Lo que no aparece
  // se soft-deletea (deleted_at).  Devuelve el árbol final + un idMap
  // para que el cliente sepa qué serverId asignar a cada item nuevo.
  saveTree(input: NavigationTreeInput): Promise<SaveTreeResult>;
}

class NavigationRepository implements NavigationRepositoryPort {
  async getTree(): Promise<NavigationTree> {
    throw new Error('Not implemented');
  }
  async saveTree(_input: NavigationTreeInput): Promise<SaveTreeResult> {
    throw new Error('Not implemented');
  }
}

module.exports = NavigationRepository;
module.exports.default = NavigationRepository;
