import type { SVGProps } from 'react';
import { cn } from '../../../../shared/lib/cn.js';
import UserAvatar from './UserAvatar.jsx';
import RolesSelector from './RolesSelector.jsx';
import StatusBadge from './StatusBadge.jsx';
import {
  computePresence,
  formatLastSeen,
  type UserRow
} from '../../domain/user.mapper.js';

function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={11}
      height={11}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

interface ReadOnlyFieldProps {
  label: string;
  value?: string | null;
  mono?: boolean;
}

function ReadOnlyField({ label, value, mono = false }: ReadOnlyFieldProps) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-faint">
        {label}
      </p>
      <p
        className={cn(
          'mt-1 break-all text-[12.5px] text-fg',
          mono && 'font-mono tabular-nums'
        )}
      >
        {value || <span className="italic text-fg-faint">—</span>}
      </p>
    </div>
  );
}

export interface UserSidePanelProps {
  user: UserRow;
  availableRoles: string[];
  /**
   * Tiempo "ahora" en ms — viene del page para que el tick local se
   * propague también a este panel y la presencia se mantenga viva.
   */
  nowMs: number;
  /** Si true, oculta los controles de asignación/desasignación de roles. */
  readOnly?: boolean;
  onAddRole: (userId: string, role: string) => Promise<void> | void;
  onRemoveRole: (userId: string, role: string) => Promise<void> | void;
  onClose: () => void;
}

export default function UserSidePanel({
  user,
  availableRoles,
  nowMs,
  readOnly = false,
  onAddRole,
  onRemoveRole,
  onClose
}: UserSidePanelProps) {
  const presence = computePresence(user.lastActivityAt, user.hasActiveSession, nowMs);
  const lastSeen = formatLastSeen(user.lastActivityAt, nowMs);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-2 px-5 py-3">
        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
          Detalles del usuario
        </span>
        <button
          type="button"
          onClick={onClose}
          title="Cerrar panel"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-fg-faint outline-none transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/15 dark:hover:text-red-400"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="h-px shrink-0 bg-border-subtle" />

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-bold text-fg">
              {user.name}
            </p>
            <div className="mt-1">
              <StatusBadge presence={presence} />
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <ReadOnlyField label="Usuario SAP" value={user.sapUser} mono />
          <ReadOnlyField label="Correo electrónico" value={user.email} />
          <ReadOnlyField label="Última actividad" value={lastSeen} />
        </div>

        <div className="h-px shrink-0 bg-border-subtle" />

        <div className="flex min-h-0 flex-1 flex-col">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-faint">
            Roles asignados
          </p>
          <div className="mt-2 flex min-h-0 flex-1 flex-col">
            <RolesSelector
              assigned={user.roles ?? []}
              available={availableRoles}
              readOnly={readOnly}
              onAdd={(role) => onAddRole(user.id, role)}
              onRemove={(role) => onRemoveRole(user.id, role)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
