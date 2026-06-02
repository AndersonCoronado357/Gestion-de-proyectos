import type { UserPresence } from './user.mapper.js';

export interface PresenceMeta {
  id: UserPresence;
  label: string;
  dot: string;
  text: string;
  bg: string;
}

// Estados de presencia derivados del backend:
//   - online   → conectado y activo (heartbeat reciente).
//   - away     → conectado pero sin actividad reciente.
//   - offline  → sin sesión abierta o nunca inició sesión.
//
// Los `bg`/`text` incluyen variante `dark:` para que el badge se vea
// bien también en modo oscuro.
export const PRESENCE_META: readonly PresenceMeta[] = [
  {
    id: 'online',
    label: 'Conectado',
    dot: 'bg-success',
    text: 'text-success-text',
    bg: 'bg-success-surface'
  },
  {
    id: 'away',
    label: 'Ausente',
    dot: 'bg-warning',
    text: 'text-warning-text',
    bg: 'bg-warning-surface'
  },
  {
    id: 'offline',
    label: 'Sin iniciar sesión',
    dot: 'bg-fg-faint',
    text: 'text-fg-muted',
    bg: 'bg-bg-muted'
  }
] as const;

export function getPresenceMeta(
  presence: UserPresence | string | null | undefined
): PresenceMeta {
  return (
    PRESENCE_META.find((s) => s.id === presence) ??
    PRESENCE_META[PRESENCE_META.length - 1]!
  );
}
