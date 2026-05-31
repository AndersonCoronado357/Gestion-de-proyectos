import { useMemo } from 'react';
import { useResourceTree } from '../hooks/useResources.js';
import { useRolesBuilder } from '../hooks/useRolesBuilder.js';
import { useCan } from '../../../auth/ui/useCan.js';
import RolesListView from '../components/RolesListView.jsx';
import RoleDetailView from '../components/RoleDetailView.jsx';

export default function RolesAndPermissionsPage() {
  const resourceTree = useResourceTree();
  const builder = useRolesBuilder();
  const canCreate = useCan('create');
  const canEdit = useCan('edit');
  const canDelete = useCan('delete');

  // El catálogo de cargos viene del backend (`services`); la UI sólo
  // necesita { id, label } así que mapeamos code → id, description → label.
  const cargos = useMemo(
    () =>
      builder.services.map((s) => ({
        id: s.code,
        label: s.description
      })),
    [builder.services]
  );

  return (
    <div className="flex h-full flex-col overflow-hidden p-3 sm:p-4 lg:p-8">
      <div className="flex h-full flex-col overflow-hidden rounded-xl bg-bg shadow-sm">
        {builder.selectedRole ? (
          <RoleDetailView
            key={builder.selectedRole.id}
            role={builder.selectedRole}
            resourceTree={resourceTree}
            cargos={cargos}
            canEdit={canEdit}
            canCreate={canCreate}
            canDelete={canDelete}
            isNewCreation={builder.isCurrentRoleNewCreation}
            onUpdate={builder.updateRole}
            onTogglePermission={builder.togglePermission}
            onToggleSubmoduleAll={builder.toggleSubmoduleAll}
            onToggleModuleAll={builder.toggleModuleAll}
            onToggleGlobalAll={builder.toggleGlobalAll}
            onToggleCargo={builder.toggleCargo}
            onDelete={(id) => {
              builder.deleteRole(id);
              builder.setSelectedRoleId(null);
            }}
            onBack={() => builder.setSelectedRoleId(null)}
          />
        ) : (
          <RolesListView
            roles={builder.roles}
            selectedRoleId={null}
            statsByRole={builder.statsByRole}
            canCreate={canCreate}
            canDelete={canDelete}
            onSelect={builder.setSelectedRoleId}
            onCreate={builder.createRole}
            onDelete={builder.deleteRole}
          />
        )}
      </div>
    </div>
  );
}
