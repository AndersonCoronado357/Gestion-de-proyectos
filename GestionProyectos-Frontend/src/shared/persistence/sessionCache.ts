// Caché de "datos no sensibles" para acelerar reloads — ahora sobre
// IndexedDB (ver idb.ts), NO localStorage.
//
// Guardamos:
//   - el `AuthUser` (nombre, roles, presencia, etc.) — NUNCA el token.
//   - el árbol de navegación (indexado por userId para no mezclar usuarios).
//
// Al montar la app, el AuthContext hidrata estos estados desde el caché
// (lectura asíncrona, muy rápida gracias al espejo en memoria) → el dashboard
// se pinta de inmediato.  En paralelo corre `/auth/refresh` + `/auth/me` +
// el fetch del árbol y, al terminar, actualiza estado y caché.
//
// La vigencia de la SESIÓN la define la cookie httpOnly del refresh token
// (server-side); si esa cookie ya no es válida, el bootstrap falla y se
// limpia este caché.  El token de acceso sigue viviendo SÓLO en memoria.

import { idbGet, idbSet, idbDel, idbWarm } from './idb.js';
import type { AuthUser } from '../../modules/auth/domain/user.js';
import type { NavigationTree } from '../../modules/navigation/domain/navigation.types.js';

const AUTH_KEY = 'auth-user';
const NAV_KEY = 'nav-tree';

interface NavRecord {
  userId: number;
  tree: NavigationTree;
}

// Pre-cargamos al espejo en memoria apenas se importa el módulo → cuando el
// AuthContext pide estos valores en el arranque, ya están listos.
idbWarm(AUTH_KEY, NAV_KEY);

// ── Auth user ──────────────────────────────────────────────────────

export function loadCachedUser(): Promise<AuthUser | null> {
  return idbGet<AuthUser>(AUTH_KEY);
}

export function saveCachedUser(user: AuthUser): void {
  void idbSet(AUTH_KEY, user); // fire-and-forget
}

export function clearCachedUser(): void {
  void idbDel(AUTH_KEY);
}

// ── Navigation tree ────────────────────────────────────────────────

export async function loadCachedNavTree(userId: number): Promise<NavigationTree | null> {
  const rec = await idbGet<NavRecord>(NAV_KEY);
  return rec && rec.userId === userId ? rec.tree : null;
}

export function saveCachedNavTree(userId: number, tree: NavigationTree): void {
  void idbSet<NavRecord>(NAV_KEY, { userId, tree });
}

export function clearCachedNavTree(): void {
  void idbDel(NAV_KEY);
}

// ── Limpieza completa (logout / sesión inválida) ───────────────────

export function clearAllSessionCache(): void {
  clearCachedUser();
  clearCachedNavTree();
}
