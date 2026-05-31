// Lectura liviana del catálogo de roles, pensada para consumidores que
// sólo necesitan listar nombres (ej. el side panel de Usuarios).
//
// Diferencias con `useRolesBuilder`:
//   - Sólo lee, no mutaciones.
//   - No carga el catálogo de cargos.
//   - Igual se mantiene en vivo: subscribe al canal SSE `roles` para
//     reflejar inmediatamente los cambios hechos desde la pantalla de
//     Roles & Permisos en otra pestaña/cliente.

import { useEffect, useState } from 'react';
import {
  rolesHttpAdapter,
  type RemoteRole
} from '../../adapters/exit/roles.http.adapter.js';
import { realtimeClient } from '../../../../shared/realtime/adapters/sse.adapter.js';

export interface AvailableRole {
  id: number;
  name: string;
  isSuper: boolean;
}

type RolesEvent =
  | { type: 'created'; role: RemoteRole }
  | { type: 'updated'; role: RemoteRole }
  | { type: 'deleted'; roleId: number };

function toAvailable(r: RemoteRole): AvailableRole {
  return { id: r.id, name: r.name, isSuper: Boolean(r.isSuper) };
}

export function useRolesCatalog() {
  const [roles, setRoles] = useState<AvailableRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await rolesHttpAdapter.list();
        if (cancelled) return;
        setRoles(r.map(toAvailable));
      } catch {
        // El consumidor degrada con la lista vacía — no tiene sentido
        // bloquear el panel por un fallo transitorio.
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const unsub = realtimeClient.subscribe<RolesEvent>('roles', (e) => {
      if (!e || typeof e !== 'object') return;
      if (e.type === 'deleted') {
        setRoles((prev) => prev.filter((r) => r.id !== e.roleId));
        return;
      }
      const next = toAvailable(e.role);
      setRoles((prev) =>
        prev.some((r) => r.id === next.id)
          ? prev.map((r) => (r.id === next.id ? next : r))
          : [...prev, next]
      );
    });
    return unsub;
  }, []);

  return { roles, loading };
}
