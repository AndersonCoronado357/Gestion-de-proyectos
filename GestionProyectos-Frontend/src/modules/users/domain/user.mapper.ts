// Mapeo backend → UI para el listado de usuarios.
//
// IMPORTANTE: la `presence` se calcula EN EL FRONT a partir de los
// campos crudos `lastActivityAt` + `hasActiveSession` + el tiempo
// actual.  Así la transición `online → away` (basada en tiempo, no en
// un evento) se ve en vivo con un re-render local cada pocos segundos
// — sin polling ni refetch al backend.

export type UserPresence = 'online' | 'away' | 'offline';

// Si el último heartbeat es ≤ 2 min → "online".
const ACTIVE_THRESHOLD_MS = 2 * 60 * 1000;

export function computePresence(
  lastActivityAt: string | null | undefined,
  hasActiveSession: boolean,
  nowMs: number = Date.now()
): UserPresence {
  if (!hasActiveSession) return 'offline';
  if (!lastActivityAt) return 'away';
  const t = new Date(lastActivityAt).getTime();
  if (!Number.isFinite(t)) return 'away';
  return nowMs - t <= ACTIVE_THRESHOLD_MS ? 'online' : 'away';
}

// Forma cruda que devuelve /api/users (igual a UserListItem del backend).
export interface RemoteUserListItem {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: 0 | 1 | 2 | 3;
  lastLoginAt: string | null;
  lastActivityAt: string | null;
  hasActiveSession: boolean;
  roles: string[];
}

// Forma que consume la tabla.  Mantiene los campos crudos y deriva
// la presencia al renderear (la columna llama a `computePresence`).
export interface UserRow {
  id: string;
  serverId: number;
  name: string;
  sapUser: string;
  email: string;
  roles: string[];
  lastActivityAt: string | null;
  hasActiveSession: boolean;
}

// "Hace 2 minutos", "Hace 3 horas", "Hace 5 días", etc.
// Si nunca ha iniciado sesión, devuelve null.
export function formatLastSeen(
  iso: string | null,
  nowMs: number = Date.now()
): string | null {
  if (!iso) return null;
  const then = new Date(iso).getTime();
  if (!Number.isFinite(then)) return null;
  const diffMs = nowMs - then;
  if (diffMs < 0) return 'Hace un momento';

  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return 'Hace un momento';
  if (min < 60) return `Hace ${min} ${min === 1 ? 'minuto' : 'minutos'}`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `Hace ${hr} ${hr === 1 ? 'hora' : 'horas'}`;

  const days = Math.floor(hr / 24);
  if (days < 7) return `Hace ${days} ${days === 1 ? 'día' : 'días'}`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `Hace ${weeks} ${weeks === 1 ? 'semana' : 'semanas'}`;

  const months = Math.floor(days / 30);
  if (months < 12) return `Hace ${months} ${months === 1 ? 'mes' : 'meses'}`;

  const years = Math.floor(days / 365);
  return `Hace ${years} ${years === 1 ? 'año' : 'años'}`;
}

export function toUserRow(remote: RemoteUserListItem): UserRow {
  const fullName = `${remote.firstName} ${remote.lastName}`.trim() || remote.username;
  return {
    id: String(remote.id),
    serverId: remote.id,
    name: fullName,
    sapUser: remote.username.toUpperCase(),
    email: remote.email,
    roles: remote.roles,
    lastActivityAt: remote.lastActivityAt ?? remote.lastLoginAt,
    hasActiveSession: remote.hasActiveSession
  };
}
