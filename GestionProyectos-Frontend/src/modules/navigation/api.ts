// Cliente HTTP para el árbol de navegación.

import { http } from '../../shared/utils/http.js';
import type {
  NavigationTree,
  NavigationTreeInput,
  SaveTreeResult
} from './domain/navigation.types.js';

export async function fetchTree(): Promise<NavigationTree> {
  const data = await http<{ tree: NavigationTree }>('/navigation/tree', {
    method: 'GET'
  });
  return data?.tree ?? [];
}

export async function saveTree(
  tree: NavigationTreeInput
): Promise<SaveTreeResult> {
  const data = await http<SaveTreeResult>('/navigation/tree', {
    method: 'PUT',
    body: { tree }
  });
  return data ?? { tree: [], idMap: { modules: {}, submodules: {} } };
}
