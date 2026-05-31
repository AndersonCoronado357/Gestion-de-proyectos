// Árbol de recursos para asignar permisos.  Viene de NavigationContext
// (mismo árbol que pinta el sidebar).  Los permisos se asignan al submódulo.
//
// CONVENCIÓN DE IDs — importantísimo:
//   - ResourceModule.id usa prefijo "mod-" (sólo se usa como React key y
//     no se persiste — los módulos no son sujetos de permisos).
//   - ResourceSubmodule.id es el ID NUMÉRICO del submódulo como string,
//     SIN prefijo.  Esa string es la key del `RolePermissionMap` que va
//     al backend y, después, la key contra la que matchea el gate de
//     acceso (`canAccessSubmodule(user, navTree.submodule.id)` → string).
//
//   Una versión anterior usaba "sub-<id>" para diferenciar visualmente.
//   Eso rompía el matching: el gate buscaba "submodule:5:view" pero el
//   backend tenía guardado "submodule:sub-5:view".  Los permisos se
//   tildaban en la UI pero nunca abrían acceso de verdad.  La migration
//   007 normaliza las filas viejas.

import { useMemo } from 'react';
import { useNavigationTree } from '../../../navigation/NavigationContext.js';

export interface ResourceSubmodule {
  id: string;
  label: string;
  iconSvg: string | null;
}

export interface ResourceModule {
  id: string;
  label: string;
  iconSvg: string | null;
  submodules: ResourceSubmodule[];
}

export function useResourceTree(): ResourceModule[] {
  const { tree } = useNavigationTree();
  return useMemo(
    () =>
      tree
        .filter((m) => m.submodules.length > 0)
        .map((m) => ({
          id: `mod-${m.id}`,
          label: m.name,
          iconSvg: m.icon,
          submodules: m.submodules.map((s) => ({
            id: String(s.id),
            label: s.name,
            iconSvg: s.icon
          }))
        })),
    [tree]
  );
}
