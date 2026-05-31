// Estado y operaciones del módulo Roles & Permisos.
//
// Carga inicial: GET /api/roles + GET /api/services.
// Mutaciones:    PUT /api/roles/:id debounced 300ms.  El debouncer ACUMULA
//                los campos modificados antes de mandar, así una edición
//                como (rename → toggle → toggle) sale en un único PUT con
//                todos los campos mergeados.
// SSE:           canal `roles` aplica deltas de otros clientes; si tenemos
//                un PUT pendiente para ese rol ignoramos el delta para no
//                pisar el optimistic update.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  PERMISSION_ACTIONS,
  type PermissionActionId
} from '../../domain/permission.value-objects.js';
import type { PermissionMap } from '../../domain/role.entity.js';
import {
  rolesHttpAdapter,
  type RemoteRole,
  type RoleUpdateBody
} from '../../adapters/exit/roles.http.adapter.js';
import {
  servicesHttpAdapter,
  type RemoteService
} from '../../adapters/exit/services.http.adapter.js';
import { realtimeClient } from '../../../../shared/realtime/adapters/sse.adapter.js';

const ACTION_IDS: PermissionActionId[] = PERMISSION_ACTIONS.map((a) => a.id);
const allGranted = (): Record<string, boolean> =>
  ACTION_IDS.reduce<Record<string, boolean>>((acc, a) => ({ ...acc, [a]: true }), {});
const isFullyGranted = (p: Partial<Record<string, boolean>> | undefined): boolean =>
  !!p && ACTION_IDS.every((a) => p[a]);

export interface RoleEntry {
  id: string;
  serverId: number;
  name: string;
  description: string;
  permissions: PermissionMap;
  cargos: string[];
  /** Rol de sistema con acceso total — read-only en el detail view. */
  isSuper: boolean;
}

export interface RoleStats {
  resources: number;
  grants: number;
}

// Prefijo que `createRole` usa al insertar un rol nuevo.  La UI lo detecta
// para mostrar inputs vacíos hasta que el usuario ponga un nombre real.
export const PLACEHOLDER_NAME_PREFIX = '__nuevo__:';
export const isPlaceholderRoleName = (name: string): boolean =>
  name.startsWith(PLACEHOLDER_NAME_PREFIX);

function fromRemote(r: RemoteRole): RoleEntry {
  return {
    id: String(r.id),
    serverId: r.id,
    name: r.name,
    description: r.description ?? '',
    permissions: r.permissions ?? {},
    cargos: r.cargos ?? [],
    isSuper: Boolean(r.isSuper)
  };
}

type RolesEvent =
  | { type: 'created'; role: RemoteRole }
  | { type: 'updated'; role: RemoteRole }
  | { type: 'deleted'; roleId: number };

export function useRolesBuilder() {
  const [roles, setRoles] = useState<RoleEntry[]>([]);
  const [services, setServices] = useState<RemoteService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRoleId, setSelectedRoleIdRaw] = useState<string | null>(null);
  // ID del rol que el usuario acaba de crear EN ESTA SESIÓN.  Lo usamos
  // para que, con sólo permiso `create`, pueda terminar de llenar
  // nombre/descripción/permisos del rol recién creado.  En cuanto navega
  // fuera del detalle (back o selecciona otro), lo limpiamos → el rol
  // pasa a ser "existente" y se bloquea hasta tener permiso `edit`.
  const [recentlyCreatedRoleId, setRecentlyCreatedRoleId] =
    useState<string | null>(null);

  const setSelectedRoleId = useCallback((id: string | null) => {
    setRecentlyCreatedRoleId((prev) => (prev === id ? prev : null));
    setSelectedRoleIdRaw(id);
  }, []);

  // Ref espejo del state, usado para leer el estado actual de forma sync
  // dentro de los handlers (los callbacks de setState corren después).
  const rolesRef = useRef<RoleEntry[]>(roles);
  rolesRef.current = roles;

  const applyToRole = useCallback(
    (id: string, mutate: (r: RoleEntry) => RoleEntry): RoleEntry | null => {
      const current = rolesRef.current.find((r) => r.id === id);
      if (!current) return null;
      const next = mutate(current);
      const list = rolesRef.current.map((r) => (r.id === id ? next : r));
      rolesRef.current = list;
      setRoles(list);
      return next;
    },
    []
  );

  // Debouncer con acumulador (uno por rol).  Cada llamada mergea el patch
  // en el body pendiente y resetea el timer.  Cuando el timer dispara,
  // manda el body completo en un solo PUT.
  const debouncers = useRef<Map<string, number>>(new Map());
  const pendingBodies = useRef<Map<string, RoleUpdateBody>>(new Map());

  const flushPending = useCallback((id: string) => {
    debouncers.current.delete(id);
    const body = pendingBodies.current.get(id);
    pendingBodies.current.delete(id);
    if (!body || Object.keys(body).length === 0) return;
    const numId = Number(id);
    if (!Number.isFinite(numId)) return;
    rolesHttpAdapter.update(numId, body).catch(() => {
      // Si falla, el SSE eventualmente sincroniza la verdad del server.
    });
  }, []);

  const persistDebounced = useCallback(
    (id: string, patch: RoleUpdateBody) => {
      if (!Number.isFinite(Number(id))) return;
      const acc = pendingBodies.current.get(id) ?? {};
      Object.assign(acc, patch);
      pendingBodies.current.set(id, acc);
      const prev = debouncers.current.get(id);
      if (prev) window.clearTimeout(prev);
      debouncers.current.set(
        id,
        window.setTimeout(() => flushPending(id), 300)
      );
    },
    [flushPending]
  );

  // Helper para mutar SÓLO los permisos del rol y persistir.  Lo usan los
  // cuatro toggles (single action, submódulo entero, módulo entero, global).
  const updatePermissions = useCallback(
    (roleId: string, recompute: (perms: PermissionMap) => PermissionMap) => {
      const next = applyToRole(roleId, (r) => ({
        ...r,
        permissions: recompute(r.permissions)
      }));
      if (next) persistDebounced(roleId, { permissions: next.permissions });
    },
    [applyToRole, persistDebounced]
  );

  // Carga inicial.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const [r, s] = await Promise.all([
          rolesHttpAdapter.list(),
          servicesHttpAdapter.list()
        ]);
        if (cancelled) return;
        const mapped = r.map(fromRemote);
        rolesRef.current = mapped;
        setRoles(mapped);
        setServices(s);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof Error ? e.message : 'No se pudieron cargar los roles.'
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // SSE — deltas granulares.  Skipea cuando hay PUT pendiente para no
  // pisar el optimistic update.
  useEffect(() => {
    const unsub = realtimeClient.subscribe<RolesEvent>('roles', (e) => {
      if (!e || typeof e !== 'object') return;
      if (e.type === 'deleted') {
        setRoles((prev) => {
          const next = prev.filter((r) => r.serverId !== e.roleId);
          rolesRef.current = next;
          return next;
        });
        setSelectedRoleIdRaw((prev) =>
          prev === String(e.roleId) ? null : prev
        );
        setRecentlyCreatedRoleId((prev) =>
          prev === String(e.roleId) ? null : prev
        );
        return;
      }
      const incoming = fromRemote(e.role);
      if (pendingBodies.current.has(String(incoming.serverId))) return;
      setRoles((prev) => {
        const exists = prev.some((r) => r.serverId === incoming.serverId);
        const next = exists
          ? prev.map((r) => (r.serverId === incoming.serverId ? incoming : r))
          : [...prev, incoming];
        rolesRef.current = next;
        return next;
      });
    });
    return unsub;
  }, []);

  // ── Mutaciones ──────────────────────────────────────────────────────

  const updateRole = (id: string, patch: Partial<RoleEntry>) => {
    const next = applyToRole(id, (r) => ({ ...r, ...patch }));
    if (!next) return;
    const body: RoleUpdateBody = {};
    if (patch.name !== undefined) body.name = next.name;
    if (patch.description !== undefined) body.description = next.description;
    if (patch.permissions !== undefined) body.permissions = next.permissions;
    if (patch.cargos !== undefined) body.cargos = next.cargos;
    if (Object.keys(body).length > 0) persistDebounced(id, body);
  };

  // Crea con nombre placeholder único (timestamp); la UI lo esconde y muestra
  // inputs vacíos hasta que el usuario lo renombre.
  const createRole = async () => {
    try {
      const created = await rolesHttpAdapter.create({
        name: `${PLACEHOLDER_NAME_PREFIX}${Date.now()}`,
        description: '',
        permissions: {},
        cargos: []
      });
      if (!created) return;
      const entry = fromRemote(created);
      setRoles((prev) => {
        const next = prev.some((r) => r.serverId === entry.serverId)
          ? prev
          : [...prev, entry];
        rolesRef.current = next;
        return next;
      });
      // Marcamos el rol como "recién creado en esta sesión" para que un
      // usuario con sólo `create` pueda terminar de configurarlo.
      setSelectedRoleIdRaw(entry.id);
      setRecentlyCreatedRoleId(entry.id);
    } catch {
      /* ignore — la lista local queda intacta */
    }
  };

  const deleteRole = async (id: string) => {
    // Cancelar PUT pendiente.
    const handle = debouncers.current.get(id);
    if (handle) window.clearTimeout(handle);
    debouncers.current.delete(id);
    pendingBodies.current.delete(id);

    setRoles((prev) => {
      const next = prev.filter((r) => r.id !== id);
      rolesRef.current = next;
      if (selectedRoleId === id) setSelectedRoleId(next[0]?.id ?? null);
      return next;
    });
    const numId = Number(id);
    if (Number.isFinite(numId)) {
      try {
        await rolesHttpAdapter.remove(numId);
      } catch {
        /* ignore */
      }
    }
  };

  const togglePermission = (roleId: string, resourceId: string, action: string) =>
    updatePermissions(roleId, (perms) => {
      const current = perms[resourceId] ?? {};
      const flipped = { ...current, [action]: !current[action] };
      const next = { ...perms };
      if (ACTION_IDS.every((a) => !flipped[a])) delete next[resourceId];
      else next[resourceId] = flipped;
      return next;
    });

  const toggleSubmoduleAll = (roleId: string, submoduleId: string) =>
    updatePermissions(roleId, (perms) => {
      const next = { ...perms };
      if (isFullyGranted(perms[submoduleId])) delete next[submoduleId];
      else next[submoduleId] = allGranted();
      return next;
    });

  const toggleModuleAll = (roleId: string, submoduleIds: string[]) =>
    updatePermissions(roleId, (perms) => {
      const allOn = submoduleIds.every((sid) => isFullyGranted(perms[sid]));
      const next = { ...perms };
      if (allOn) submoduleIds.forEach((sid) => delete next[sid]);
      else submoduleIds.forEach((sid) => { next[sid] = allGranted(); });
      return next;
    });

  const toggleGlobalAll = (roleId: string, allSubmoduleIds: string[]) =>
    updatePermissions(roleId, (perms) => {
      const allOn = allSubmoduleIds.every((sid) => isFullyGranted(perms[sid]));
      if (allOn) return {};
      const next: PermissionMap = {};
      allSubmoduleIds.forEach((sid) => { next[sid] = allGranted(); });
      return next;
    });

  const toggleCargo = (roleId: string, cargoId: string) => {
    const next = applyToRole(roleId, (r) => {
      const has = r.cargos.includes(cargoId);
      return {
        ...r,
        cargos: has ? r.cargos.filter((c) => c !== cargoId) : [...r.cargos, cargoId]
      };
    });
    if (next) persistDebounced(roleId, { cargos: next.cargos });
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId) ?? null;

  const statsByRole: Record<string, RoleStats> = useMemo(
    () =>
      Object.fromEntries(
        roles.map((r) => {
          const resources = Object.keys(r.permissions).length;
          const grants = Object.values(r.permissions).reduce<number>(
            (acc, perms) => acc + Object.values(perms ?? {}).filter(Boolean).length,
            0
          );
          return [r.id, { resources, grants }];
        })
      ),
    [roles]
  );

  // True si el rol que el usuario está mirando lo creó en esta sesión.
  // El detail view lo usa para habilitar la edición aunque sólo tenga
  // permiso `create`.
  const isCurrentRoleNewCreation =
    selectedRoleId !== null && selectedRoleId === recentlyCreatedRoleId;

  return {
    roles,
    services,
    loading,
    error,
    selectedRole,
    selectedRoleId,
    setSelectedRoleId,
    isCurrentRoleNewCreation,
    createRole,
    updateRole,
    deleteRole,
    togglePermission,
    toggleSubmoduleAll,
    toggleModuleAll,
    toggleGlobalAll,
    toggleCargo,
    statsByRole
  };
}
