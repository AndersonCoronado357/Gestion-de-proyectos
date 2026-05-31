// Mirror del shape devuelto por GET /api/navigation/tree.

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

// Input que mandamos en PUT /api/navigation/tree.
//
// `clientId` es opcional pero recomendado para items nuevos: el server
// echoa los pares clientId→serverId en `idMap`, así el front sabe sin
// ambigüedad qué id local recibió qué id de servidor.  Esto es crítico
// para el auto-save: si el usuario sigue editando mientras el save
// vuela, no podemos hacer matching por posición porque la lista cambió.
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

export interface IdMap {
  modules: Record<string, number>;
  submodules: Record<string, number>;
}

export interface SaveTreeResult {
  tree: NavigationTree;
  idMap: IdMap;
}
