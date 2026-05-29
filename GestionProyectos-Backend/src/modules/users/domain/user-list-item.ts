// Forma "lista" del usuario para el listado público (sin datos sensibles).
//
// La presence (online/away/offline) la calcula el FRONT a partir de
// estos campos crudos.  Así la transición `online → away` (basada en
// tiempo, no en un evento) se ve en vivo con un re-render local cada
// pocos segundos — sin polling al backend.

import type { UserStatus } from '../../auth/domain/auth.types';

export interface UserListItem {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  status: UserStatus;
  lastLoginAt: string | null;
  lastActivityAt: string | null;
  /** True si el usuario tiene al menos una sesión activa (no revocada, no expirada). */
  hasActiveSession: boolean;
  roles: string[];
}
