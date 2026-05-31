import { cn } from '../../../../shared/lib/cn.js';
import {
  getPresenceMeta
} from '../../domain/user.value-objects.js';
import type { UserPresence } from '../../domain/user.mapper.js';

export interface StatusBadgeProps {
  presence: UserPresence | string | null | undefined;
}

/**
 * Badge de presencia del usuario.  Muestra "Conectado / Ausente / Sin
 * iniciar sesión" con un dot del color correspondiente.  El estado lo
 * deriva el backend a partir de la sesión activa + `last_activity_at`.
 */
export default function StatusBadge({ presence }: StatusBadgeProps) {
  const meta = getPresenceMeta(presence);
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium',
        meta.bg,
        meta.text
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}
