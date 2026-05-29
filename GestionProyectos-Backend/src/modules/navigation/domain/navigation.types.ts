// Tipos del árbol de navegación que el front consume para pintar el
// sidebar y para resolver las rutas dinámicas.

export interface SubmoduleNode {
  id: number;
  name: string;
  icon: string | null;
  path: string | null;
  folderKey: string | null;
  displayOrder: number;
}

export interface ModuleNode {
  id: number;
  name: string;
  icon: string | null;
  displayOrder: number;
  submodules: SubmoduleNode[];
}

export type NavigationTree = ModuleNode[];

// Input del PUT /api/navigation/tree.
//
// Los `id` son opcionales — si vienen, hacemos UPDATE; si no, INSERT.
// Lo que no aparece en el payload se soft-deletea (deleted_at = now).
//
// `clientId` es opcional pero recomendado para items nuevos (sin id):
// el servidor lo echoa en el `idMap` de la respuesta para que el cliente
// sepa qué serverId asignarle a cada item local sin depender de la
// posición — eso evita mismatches cuando el usuario sigue editando
// durante un auto-save en vuelo.
export interface SubmoduleInput {
  id?: number | null;
  clientId?: string | null;
  name: string;
  icon?: string | null;
  path?: string | null;
  folderKey?: string | null;
}

export interface ModuleInput {
  id?: number | null;
  clientId?: string | null;
  name: string;
  icon?: string | null;
  submodules: SubmoduleInput[];
}

export type NavigationTreeInput = ModuleInput[];

// Mapa clientId → serverId para items recién insertados.
export interface IdMap {
  modules: Record<string, number>;
  submodules: Record<string, number>;
}

// Resultado de `saveTree`: árbol persistido + mapa de IDs nuevos.
export interface SaveTreeResult {
  tree: NavigationTree;
  idMap: IdMap;
}
