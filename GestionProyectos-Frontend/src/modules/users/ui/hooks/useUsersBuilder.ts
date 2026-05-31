// Hook que orquesta la lista de usuarios y el panel lateral.
//
// REAL-TIME PURO — sin polling.  Tres fuentes de update en vivo:
//
//   1. SSE canal `users` con DELTAS granulares.  Cada evento actualiza
//      sólo la fila afectada — nunca refetcheamos toda la lista:
//        - { type: 'session', userId, hasActiveSession, lastActivityAt? }
//        - { type: 'activity', userId, lastActivityAt }
//        - { type: 'roles',    userId, roles }
//
//   2. Tick local cada 10s — sólo bumpea un contador para forzar el
//      re-render.  La presencia (`online → away`) se calcula en el
//      front a partir de `lastActivityAt`, así no necesita network.
//
//   3. Cambios optimistas + persistencia.  `addRoleToUser` /
//      `removeRoleFromUser` actualizan local primero, llaman al backend
//      después; cuando el backend broadcast llegue por SSE, vuelve a
//      sincronizar.

import { useCallback, useEffect, useRef, useState } from 'react';
import { usersHttpAdapter } from '../../adapters/exit/users.http.adapter.js';
import {
  toUserRow,
  type UserRow
} from '../../domain/user.mapper.js';
import { realtimeClient } from '../../../../shared/realtime/adapters/sse.adapter.js';

const PRESENCE_TICK_MS = 10_000;

export interface UsersBuilderApi {
  users: UserRow[];
  // Tick que cambia cada PRESENCE_TICK_MS para forzar re-render.  El
  // consumidor puede leerlo o ignorarlo — lo importante es que cambie.
  presenceTick: number;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  selectedUser: UserRow | null;
  openUser: (id: string) => void;
  closePanel: () => void;
  addRoleToUser: (userId: string, role: string) => Promise<void>;
  removeRoleFromUser: (userId: string, role: string) => Promise<void>;
}

// Tipos de los eventos SSE del canal `users`.
type UsersEvent =
  | { type: 'session'; userId: number; hasActiveSession: boolean; lastActivityAt?: string }
  | { type: 'activity'; userId: number; lastActivityAt: string }
  | { type: 'roles'; userId: number; roles: string[] };

export function useUsersBuilder(): UsersBuilderApi {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [presenceTick, setPresenceTick] = useState(0);

  // Para que el handler SSE pueda chequear "¿conozco este usuario?".
  const userIdsRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    userIdsRef.current = new Set(users.map((u) => u.serverId));
  }, [users]);

  // Ref espejo del state, usado para leer los roles actuales de un user
  // de forma SÍNCRONA dentro de los handlers — el callback de setState
  // puede correr fuera de banda y dejarnos con un array vacío al persistir.
  const usersRef = useRef<UserRow[]>(users);
  usersRef.current = users;

  const reload = useCallback(async () => {
    setError(null);
    try {
      const remote = await usersHttpAdapter.list();
      setUsers(remote.map(toUserRow));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar la lista.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial — única request.  Después todo se mantiene por SSE.
  useEffect(() => {
    setLoading(true);
    void reload();
  }, [reload]);

  // SSE — aplicar DELTAS sin refetch.
  useEffect(() => {
    const unsubscribe = realtimeClient.subscribe<UsersEvent>('users', (e) => {
      if (!e || typeof e !== 'object') return;

      // Si el evento llega para un usuario que aún no conocemos
      // (recién creado, etc.) hacemos una sola recarga para traerlo.
      if (!userIdsRef.current.has(e.userId)) {
        void reload();
        return;
      }

      setUsers((prev) =>
        prev.map((u) => {
          if (u.serverId !== e.userId) return u;
          if (e.type === 'session') {
            return {
              ...u,
              hasActiveSession: e.hasActiveSession,
              lastActivityAt: e.lastActivityAt ?? u.lastActivityAt
            };
          }
          if (e.type === 'activity') {
            return { ...u, lastActivityAt: e.lastActivityAt };
          }
          if (e.type === 'roles') {
            return { ...u, roles: e.roles };
          }
          return u;
        })
      );
    });
    return unsubscribe;
  }, [reload]);

  // Tick local para que la presencia derivada (online ↔ away, basada
  // en tiempo) se refresque sin pedirle nada al backend.
  useEffect(() => {
    const id = window.setInterval(
      () => setPresenceTick((n) => n + 1),
      PRESENCE_TICK_MS
    );
    return () => window.clearInterval(id);
  }, []);

  const selectedUser = users.find((u) => u.id === selectedUserId) ?? null;

  const openUser = (id: string) => setSelectedUserId(id);
  const closePanel = () => setSelectedUserId(null);

  // Mutaciones de roles: optimistic update + PUT al backend.  El
  // server broadcastea y el handler SSE de arriba sincroniza el resto.
  const persistRoles = useCallback(async (userId: string, nextRoles: string[]) => {
    const numId = Number(userId);
    if (!Number.isFinite(numId)) return;
    try {
      const persisted = await usersHttpAdapter.replaceRoles(numId, nextRoles);
      // Si el server devuelve algo distinto (e.g. roles inválidos
      // descartados), nos sincronizamos a su verdad.
      setUsers((prev) =>
        prev.map((u) =>
          u.serverId === numId ? { ...u, roles: persisted } : u
        )
      );
    } catch (e) {
      // Rollback simple: pedir lista entera. Raro pero seguro.
      void reload();
    }
  }, [reload]);

  const addRoleToUser = useCallback(
    async (userId: string, role: string) => {
      const user = usersRef.current.find((u) => u.id === userId);
      if (!user) return;
      if (user.roles.includes(role)) return;
      const nextRoles = [...user.roles, role];
      const next = usersRef.current.map((u) =>
        u.id === userId ? { ...u, roles: nextRoles } : u
      );
      usersRef.current = next;
      setUsers(next);
      await persistRoles(userId, nextRoles);
    },
    [persistRoles]
  );

  const removeRoleFromUser = useCallback(
    async (userId: string, role: string) => {
      const user = usersRef.current.find((u) => u.id === userId);
      if (!user) return;
      const nextRoles = user.roles.filter((r) => r !== role);
      const next = usersRef.current.map((u) =>
        u.id === userId ? { ...u, roles: nextRoles } : u
      );
      usersRef.current = next;
      setUsers(next);
      await persistRoles(userId, nextRoles);
    },
    [persistRoles]
  );

  return {
    users,
    presenceTick,
    loading,
    error,
    reload,
    selectedUser,
    openUser,
    closePanel,
    addRoleToUser,
    removeRoleFromUser
  };
}
