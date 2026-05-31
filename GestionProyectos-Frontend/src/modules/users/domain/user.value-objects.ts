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
    dot: 'bg-emerald-500',
    text: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-500/15'
  },
  {
    id: 'away',
    label: 'Ausente',
    dot: 'bg-amber-500',
    text: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-500/15'
  },
  {
    id: 'offline',
    label: 'Sin iniciar sesión',
    dot: 'bg-slate-400',
    text: 'text-slate-600 dark:text-slate-300',
    bg: 'bg-slate-100 dark:bg-slate-500/20'
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
