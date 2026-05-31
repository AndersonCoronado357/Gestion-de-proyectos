import { useMemo } from 'react';
import { cn } from '../../../../shared/lib/cn.js';
import DataTable, {
  type ColumnDef
} from '../../../../shared/components/DataTable/index.js';
import Skeleton from '../../../../shared/components/Skeleton/index.js';
import { useUsersBuilder } from '../hooks/useUsersBuilder.js';
import UserAvatar from '../components/UserAvatar.js';
import UserSidePanel from '../components/UserSidePanel.js';
import StatusBadge from '../components/StatusBadge.js';
import { useRolesCatalog } from '../../../roles-and-permissions/ui/hooks/useRolesCatalog.js';
import { useCan } from '../../../auth/ui/useCan.js';
import { getPresenceMeta } from '../../domain/user.value-objects.js';
import {
  computePresence,
  formatLastSeen,
  type UserRow
} from '../../domain/user.mapper.js';

// Cuando el panel lateral está cerrado mostramos las 5 columnas. Cuando se
// abre, ocultamos Estado y Última actividad para que las restantes
// (Usuario, SAP, Email) tengan más aire en el ancho reducido.
function buildColumns(panelOpen: boolean, nowMs: number): ColumnDef<UserRow>[] {
  const cols: ColumnDef<UserRow>[] = [
    {
      id: 'name',
      label: 'Usuario',
      accessor: (u) => u.name,
      filter: 'select',
      width: panelOpen ? '30%' : '27%',
      render: (u) => (
        <div className="flex items-center gap-3">
          <UserAvatar user={u} size="sm" />
          <span className="text-[12.5px] font-semibold text-fg">{u.name}</span>
        </div>
      )
    },
    {
      id: 'sapUser',
      label: 'Usuario SAP',
      accessor: (u) => u.sapUser,
      filter: 'select',
      width: panelOpen ? '20%' : '12%',
      render: (u) => (
        <span className="font-mono text-[12px] font-semibold uppercase tracking-wider text-fg-muted">
          {u.sapUser || '—'}
        </span>
      )
    },
    {
      id: 'email',
      label: 'Email',
      accessor: (u) => u.email,
      filter: 'select',
      width: panelOpen ? '50%' : '35%',
      render: (u) => (
        <span className="text-[12px] text-fg-muted">{u.email}</span>
      )
    }
  ];

  if (!panelOpen) {
    cols.push(
      {
        id: 'presence',
        label: 'Estado',
        accessor: (u) => computePresence(u.lastActivityAt, u.hasActiveSession, nowMs),
        filter: 'select',
        filterLabelFor: (raw) => getPresenceMeta(raw).label,
        width: '17%',
        render: (u) => (
          <StatusBadge
            presence={computePresence(u.lastActivityAt, u.hasActiveSession, nowMs)}
          />
        )
      },
      {
        id: 'lastSeen',
        label: 'Última actividad',
        accessor: (u) => u.lastActivityAt,
        sortable: false,
        width: '13%',
        render: (u) => (
          <span className="text-[11px] text-fg-faint">
            {formatLastSeen(u.lastActivityAt, nowMs) ?? '—'}
          </span>
        )
      }
    );
  }

  return cols;
}

const SKELETON_ROW_COUNT = 8;

function buildSkeletonRows(): UserRow[] {
  return Array.from({ length: SKELETON_ROW_COUNT }, (_, i) => ({
    id: `__sk_${i}`,
    serverId: i,
    name: '',
    sapUser: '',
    email: '',
    roles: [],
    lastActivityAt: null,
    hasActiveSession: false
  }));
}

function buildSkeletonColumns(panelOpen: boolean): ColumnDef<UserRow>[] {
  const cell = (w: string) => (
    <Skeleton variant="text" width={w} height={12} />
  );
  const cols: ColumnDef<UserRow>[] = [
    {
      id: 'name',
      label: 'Usuario',
      accessor: () => '',
      sortable: false,
      width: panelOpen ? '30%' : '27%',
      render: () => (
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" width={28} height={28} />
          {cell('70%')}
        </div>
      )
    },
    {
      id: 'sapUser',
      label: 'Usuario SAP',
      accessor: () => '',
      sortable: false,
      width: panelOpen ? '20%' : '12%',
      render: () => cell('60%')
    },
    {
      id: 'email',
      label: 'Email',
      accessor: () => '',
      sortable: false,
      width: panelOpen ? '50%' : '35%',
      render: () => cell('80%')
    }
  ];
  if (!panelOpen) {
    cols.push(
      {
        id: 'status',
        label: 'Estado',
        accessor: () => '',
        sortable: false,
        width: '13%',
        render: () => <Skeleton width={64} height={18} />
      },
      {
        id: 'lastSeen',
        label: 'Última actividad',
        accessor: () => '',
        sortable: false,
        width: '13%',
        render: () => cell('70%')
      }
    );
  }
  return cols;
}

export default function UsersPage() {
  const builder = useUsersBuilder();
  // El catálogo de roles ahora viene del backend (no de una constante).
  // El hook se mantiene vivo vía SSE — si en otra pestaña creás o
  // renombrás un rol, los chips del panel lateral se refrescan solos.
  const rolesCatalog = useRolesCatalog();
  const availableRoles = useMemo(
    () => rolesCatalog.roles.map((r) => r.name),
    [rolesCatalog.roles]
  );
  // Sólo permitimos asignar/desasignar roles si el usuario actual tiene
  // permiso `edit` sobre el submódulo de Usuarios.
  const canEditUsers = useCan('edit');
  const panelOpen = !!builder.selectedUser;

  // El tick del builder dispara re-renders cada 10s para que la
  // presencia derivada se actualice (online → away cuando vence el
  // umbral).  Como `Date.now()` se evalúa en cada render, viene "fresco".
  const nowMs = Date.now();
  // Referenciamos `presenceTick` para que React vea la dependencia y
  // memorice las columnas correctamente.
  const _ = builder.presenceTick;

  const columns = useMemo(
    () =>
      builder.loading
        ? buildSkeletonColumns(panelOpen)
        : buildColumns(panelOpen, nowMs),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [builder.loading, panelOpen, builder.presenceTick]
  );
  const data = builder.loading ? buildSkeletonRows() : builder.users;

  const subtitle = builder.error
    ? builder.error
    : builder.loading
      ? ''
      : `${builder.users.length} usuario${builder.users.length === 1 ? '' : 's'} registrado${builder.users.length === 1 ? '' : 's'}`;

  return (
    <div className="flex h-full gap-4 overflow-hidden p-3 sm:p-4 lg:p-8">
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-bg shadow-sm">
        <div className="shrink-0 px-4 pt-4 pb-1 sm:px-5 sm:pt-5">
          <h2 className="text-[18px] font-bold tracking-tight text-fg">
            Usuarios
          </h2>
          {builder.loading ? (
            <Skeleton variant="text" width={140} height={11} className="mt-0.5" />
          ) : (
            <p
              className={cn(
                'mt-0.5 text-[11px]',
                builder.error ? 'text-red-600' : 'text-fg-faint'
              )}
            >
              {subtitle}
            </p>
          )}
        </div>

        <DataTable
          data={data}
          columns={columns}
          onRowClick={
            builder.loading ? undefined : (_key, u) => builder.openUser(u.id)
          }
          initialPageSize={10}
          emptyMessage={
            builder.error
              ? 'No se pudo cargar la lista'
              : 'No hay usuarios que coincidan'
          }
        />
      </div>

      {panelOpen && (
        <button
          type="button"
          aria-label="Cerrar panel"
          onClick={builder.closePanel}
          className="fixed inset-0 z-30 bg-black/40 md:hidden animate-[fade-in_180ms_ease-out]"
        />
      )}

      <div
        className={cn(
          'overflow-hidden rounded-xl bg-bg shadow-sm',
          'fixed inset-y-3 right-3 z-40 w-[min(340px,calc(100vw-1.5rem))] transition-transform duration-300 ease-out',
          'md:static md:inset-auto md:z-auto md:h-full md:shrink-0 md:transition-[width,opacity,margin]',
          panelOpen
            ? 'translate-x-0 opacity-100 md:w-[340px]'
            : 'translate-x-[calc(100%+1rem)] opacity-100 md:translate-x-0 md:w-0 md:opacity-0'
        )}
      >
        {builder.selectedUser && (
          <UserSidePanel
            user={builder.selectedUser}
            availableRoles={availableRoles}
            nowMs={nowMs}
            readOnly={!canEditUsers}
            onAddRole={builder.addRoleToUser}
            onRemoveRole={builder.removeRoleFromUser}
            onClose={builder.closePanel}
          />
        )}
      </div>
    </div>
  );
}
