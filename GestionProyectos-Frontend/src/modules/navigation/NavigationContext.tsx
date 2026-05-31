// Contexto global del árbol de navegación.
//
// Una sola fuente de verdad para:
//   - lo que renderiza el sidebar
//   - lo que App.tsx convierte en <Route>s dinámicas
//   - lo que carga el builder al editar
//
// Carga del backend cuando hay usuario logueado.  Al hacer `save()` el
// backend devuelve el árbol persistido y reemplazamos el estado — así el
// sidebar se actualiza inmediato.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';
import { fetchTree, saveTree } from './api.js';
import type {
  NavigationTree,
  NavigationTreeInput,
  SaveTreeResult
} from './domain/navigation.types.js';
import { useAuth } from '../auth/ui/AuthContext.js';
import { realtimeClient } from '../../shared/realtime/adapters/sse.adapter.js';
import ViewSkeleton from '../../shared/components/ViewSkeleton/index.js';
import {
  loadCachedNavTree,
  saveCachedNavTree
} from '../../shared/persistence/sessionCache.js';

export interface NavigationContextValue {
  tree: NavigationTree;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  save: (next: NavigationTreeInput) => Promise<SaveTreeResult>;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

export function useNavigationTree(): NavigationContextValue {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigationTree fuera de <NavigationProvider>');
  return ctx;
}

export interface NavigationProviderProps {
  children: ReactNode;
}

export function NavigationProvider({ children }: NavigationProviderProps) {
  const { user } = useAuth();

  const [tree, setTree] = useState<NavigationTree>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Marca para qué `userId` ya terminó (o está disponible vía cache) la
  // carga del árbol.  Mientras `bootstrappedFor !== user?.id` no
  // renderizamos `App` — si lo hiciéramos, las rutas dinámicas estarían
  // vacías y cualquier URL fuera de /inicio o /configuracion caería al
  // wildcard `*` que redirige a /inicio.  Inicializamos a `'none'`
  // cuando no hay user para que /login no flashee skeleton; el árbol
  // cacheado (IndexedDB) se hidrata de forma asíncrona en el efecto de abajo.
  const NO_USER = 'none' as const;
  type BootstrapId = number | typeof NO_USER | null;
  const [bootstrappedFor, setBootstrappedFor] = useState<BootstrapId>(
    !user ? NO_USER : null
  );

  // Si el user cambia entre renders, reseteamos `bootstrappedFor` en el
  // MISMO render (no en useEffect), así App ve el skeleton ya en el
  // primer render después del login en vez de pintar con tree vieja.
  const prevUserIdRef = useRef<number | null>(user?.id ?? null);
  const currentUserId = user?.id ?? null;
  if (prevUserIdRef.current !== currentUserId) {
    prevUserIdRef.current = currentUserId;
    setBootstrappedFor(currentUserId === null ? NO_USER : null);
  }

  const loadedForUserId = useRef<number | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchTree();
      setTree(next);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el menú.');
      setTree([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial al loguearse / cambiar de usuario; limpieza al salir.
  useEffect(() => {
    if (!user) {
      loadedForUserId.current = null;
      setTree([]);
      setBootstrappedFor(NO_USER);
      return;
    }
    if (loadedForUserId.current === user.id) return;
    loadedForUserId.current = user.id;
    const uid = user.id;

    // (1) Camino rápido: hidratamos el árbol cacheado (IndexedDB) → el
    //     sidebar se pinta sin esperar la red.  Sólo aplicamos si el user
    //     sigue siendo el mismo (comparamos contra `loadedForUserId`, que
    //     es estable entre el doble-montaje de StrictMode).
    void loadCachedNavTree(uid).then((cached) => {
      if (cached && loadedForUserId.current === uid) {
        setTree(cached);
        setBootstrappedFor(uid);
      }
    });

    // (2) Revalidamos contra el backend y marcamos el bootstrap al terminar.
    //     NO usamos un flag `cancelled` con cleanup: en StrictMode el cleanup
    //     del primer montaje lo activaría y, como el segundo montaje sale por
    //     el guard de arriba, `bootstrappedFor` nunca se setearía (deadlock →
    //     skeleton infinito).  Guardar por `loadedForUserId` es seguro.
    refresh().finally(() => {
      if (loadedForUserId.current === uid) setBootstrappedFor(uid);
    });
  }, [user, refresh]);

  // Persistimos el árbol en localStorage para que reloads futuros se
  // hidraten desde acá sin esperar la red. Indexado por `user.id` para
  // que no se mezcle entre usuarios.
  useEffect(() => {
    if (user && tree.length > 0) {
      saveCachedNavTree(user.id, tree);
    }
  }, [user, tree]);

  const isBootstrapped =
    bootstrappedFor === NO_USER
      ? !user
      : bootstrappedFor === currentUserId;

  // Suscripción al canal 'navigation' del SSE. Cuando cualquier cliente
  // (incluido este) llama PUT /tree, el server broadcastea el árbol
  // resultante; lo aplicamos al estado y el sidebar se redibuja solo.
  useEffect(() => {
    if (!user) return;
    type TreeUpdated = { type: 'tree-updated'; tree: NavigationTree };
    const unsubscribe = realtimeClient.subscribe<TreeUpdated>(
      'navigation',
      (payload) => {
        if (payload?.type === 'tree-updated' && Array.isArray(payload.tree)) {
          setTree(payload.tree);
        }
      }
    );
    return unsubscribe;
  }, [user]);

  const save = useCallback(
    async (next: NavigationTreeInput): Promise<SaveTreeResult> => {
      const result = await saveTree(next);
      setTree(result.tree);
      return result;
    },
    []
  );

  const value = useMemo<NavigationContextValue>(
    () => ({ tree, loading, error, refresh, save }),
    [tree, loading, error, refresh, save]
  );

  return (
    <NavigationContext.Provider value={value}>
      {isBootstrapped ? children : <ViewSkeleton />}
    </NavigationContext.Provider>
  );
}
