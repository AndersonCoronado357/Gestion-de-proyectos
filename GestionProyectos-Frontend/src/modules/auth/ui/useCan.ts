// Hook que resuelve si el usuario logueado puede ejecutar una acción
// (`view` | `create` | `edit` | `delete`) sobre el submódulo en el que
// está parado.
//
// El submoduleId se deriva matcheando `location.pathname` contra el
// árbol de navegación.  De esta forma cada página gatea sus propios
// botones sin necesidad de saber su id explícitamente.
//
// Super-admin siempre devuelve true.  Si no hay usuario, false.

import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext.js';
import { useNavigationTree } from '../../navigation/NavigationContext.js';
import {
  canActOnSubmodule,
  type PermissionAction
} from '../domain/permissions.js';

function useCurrentSubmoduleId(): number | null {
  const location = useLocation();
  const { tree } = useNavigationTree();
  return useMemo(() => {
    for (const m of tree) {
      const sub = m.submodules.find((s) => s.path === location.pathname);
      if (sub) return sub.id;
    }
    return null;
  }, [tree, location.pathname]);
}

export function useCan(action: PermissionAction): boolean {
  const { user } = useAuth();
  const submoduleId = useCurrentSubmoduleId();
  if (submoduleId === null) return false;
  return canActOnSubmodule(user, submoduleId, action);
}
