export type PermissionActionId = 'view' | 'create' | 'edit' | 'delete';

export interface PermissionActionDef {
  id: PermissionActionId;
  label: string;
}

// Acciones canónicas que se pueden conceder por recurso. Si necesitas más
// (e.g. 'export', 'approve'), agrégalas aquí y la matriz las renderiza.
export const PERMISSION_ACTIONS: readonly PermissionActionDef[] = [
  { id: 'view', label: 'Ver' },
  { id: 'create', label: 'Crear' },
  { id: 'edit', label: 'Editar' },
  { id: 'delete', label: 'Eliminar' }
] as const;

export interface PermissionProps {
  resourceId?: string;
  action?: PermissionActionId;
  granted?: boolean;
}

export class Permission {
  resourceId: string | undefined;
  action: PermissionActionId | undefined;
  granted: boolean;

  constructor({ resourceId, action, granted }: PermissionProps = {}) {
    this.resourceId = resourceId;
    this.action = action;
    this.granted = granted ?? false;
  }
}
