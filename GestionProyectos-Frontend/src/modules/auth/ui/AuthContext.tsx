// Contexto global de autenticación.
//
//   - El access token vive SÓLO en memoria (state). No se guarda en localStorage
//     ni en cookies legibles — minimiza el impacto de un XSS.
//   - El refresh token vive en una cookie HttpOnly (la pone el backend).
//   - Al montar la app, intentamos restaurar la sesión via /auth/refresh
//     (la cookie viaja automáticamente) → /auth/me. Aplicamos las
//     preferencias ANTES de soltar `loading=false` para que el dashboard
//     se pinte directo con el tema correcto (sin flash).
//   - Login: aplicamos las preferencias del response ANTES de exponer el
//     `user` (sin flash al pasar de /login al dashboard).
//   - Registramos en el cliente HTTP:
//       · accessTokenGetter → para inyectar Authorization Bearer.
//       · unauthorizedHandler → para auto-refresh transparente en 401.

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
import {
  setAccessTokenGetter,
  setUnauthorizedHandler
} from '../../../shared/utils/http.js';
import { useTheme } from '../../../shared/theme/ThemeContext.js';
import ViewSkeleton from '../../../shared/components/ViewSkeleton/index.js';
import {
  clearAllSessionCache,
  loadCachedUser,
  saveCachedUser
} from '../../../shared/persistence/sessionCache.js';
import { buildAuthApi } from '../adapters/entry/auth.api.js';
import type { AuthPreferences, AuthUser } from '../domain/user.js';
import type { LoginInput } from '../dtos/login.dto.js';

export interface AuthContextValue {
  user: AuthUser | null;
  // true mientras estamos comprobando la sesión al cargar.
  loading: boolean;
  signIn: (credentials: LoginInput) => Promise<void>;
  signInWithGoogle: (credential: string) => Promise<void>;
  signOut: () => Promise<void>;
  // Acceso forzado al token actual (e.g. para tests / debugging).
  getAccessToken: () => string | null;
  // Refresca y actualiza el access token. Devuelve null si falló.
  refreshSession: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

export interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const repository = useMemo(() => buildAuthApi(), []);
  const { applyAll } = useTheme();

  // Hidratamos desde cache local — si ya hubo una sesión previa en
  // este navegador, evitamos el skeleton al recargar.  El cache no es
  // sensible: sólo el objeto `AuthUser` (nada de tokens).  El refresh
  // contra el backend corre igual en background para validar y
  // refrescar datos; si falla, limpiamos cache y mandamos a /login.
  // Estado inicial vacío + loading. El caché (IndexedDB) se hidrata de forma
  // ASÍNCRONA en el bootstrap de abajo; mientras tanto se ve el ViewSkeleton.
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // useRef en vez de state para que el getter sea estable y no cause re-renders.
  const accessTokenRef = useRef<string | null>(null);
  // Evita disparar múltiples refresh en paralelo (e.g. 3 requests a la vez).
  const refreshInFlight = useRef<Promise<string | null> | null>(null);

  const getAccessToken = useCallback(() => accessTokenRef.current, []);

  const setAccessToken = useCallback((token: string | null) => {
    accessTokenRef.current = token;
  }, []);

  const applyPreferences = useCallback(
    (prefs: AuthPreferences) => {
      applyAll({
        mode: prefs.mode,
        accentHex: prefs.accentHex,
        fontFamily: prefs.fontFamily,
        fontSize: prefs.fontSize
      });
    },
    [applyAll]
  );

  const refreshSession = useCallback(async (): Promise<string | null> => {
    if (refreshInFlight.current) return refreshInFlight.current;
    const p = (async () => {
      try {
        const data = await repository.refresh();
        setAccessToken(data.accessToken);
        return data.accessToken;
      } catch {
        setAccessToken(null);
        setUser(null);
        return null;
      } finally {
        refreshInFlight.current = null;
      }
    })();
    refreshInFlight.current = p;
    return p;
  }, [repository, setAccessToken]);

  const signIn = useCallback(
    async (credentials: LoginInput): Promise<void> => {
      const data = await repository.login(credentials);
      setAccessToken(data.accessToken);
      // Aplicamos tema ANTES de setUser → cuando React empieza a renderizar
      // las rutas privadas, el tema correcto ya está en CSS variables.
      applyPreferences(data.preferences);
      setUser(data.user);
    },
    [repository, setAccessToken, applyPreferences]
  );

  const signInWithGoogle = useCallback(
    async (credential: string): Promise<void> => {
      const data = await repository.googleLogin(credential);
      setAccessToken(data.accessToken);
      applyPreferences(data.preferences);
      setUser(data.user);
    },
    [repository, setAccessToken, applyPreferences]
  );

  const signOut = useCallback(async (): Promise<void> => {
    try {
      await repository.logout();
    } catch {
      // Aunque falle el server, dejamos al usuario fuera localmente.
    }
    setAccessToken(null);
    setUser(null);
    // Limpia user + navigation tree cacheados — al volver a /login
    // queremos arrancar de cero.
    clearAllSessionCache();
  }, [repository, setAccessToken]);

  // Mantiene el cache sincronizado con el estado de `user`.
  useEffect(() => {
    if (user) saveCachedUser(user);
    // No limpiamos en `null` acá: signOut() ya lo hace, y un null
    // transitorio durante el bootstrap no debería borrar la persistencia.
  }, [user]);

  // Bootstrap al montar: refresh → me → applyPreferences → setUser.
  // Si veníamos con `user` hidratado del cache, este flow corre IGUAL en
  // background y actualiza datos.  Si falla, limpia user + cache.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      // (1) Camino rápido: pintamos el usuario cacheado (IndexedDB) apenas
      //     esté disponible, sin esperar la red.  El refresh + me de abajo
      //     revalida y actualiza.
      const cached = await loadCachedUser();
      if (!cancelled && cached) {
        setUser(cached);
        setLoading(false);
      }
      // (2) Revalidación contra el servidor.
      const token = await refreshSession();
      if (cancelled) return;
      if (!token) {
        // Sesión inválida (expiró, fue revocada, etc.).  Limpiamos lo
        // que pudiera quedar del cache anterior y soltamos loading
        // para que ProtectedRoute mande a /login.
        clearAllSessionCache();
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const meData = await repository.me();
        if (cancelled) return;
        applyPreferences(meData.preferences);
        setUser(meData.user);
      } catch {
        if (!cancelled) {
          setAccessToken(null);
          setUser(null);
          clearAllSessionCache();
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshSession, repository, setAccessToken, applyPreferences]);

  // Sincronización entre pestañas (multi-tab logout).
  // El evento `storage` se dispara en TODAS las otras pestañas cuando
  // una llama localStorage.removeItem/setItem.  Cuando otra pestaña
  // borra la key del user (signOut) o la cambia (otro usuario logueado),
  // nos sincronizamos: tiramos al usuario fuera localmente.  Sin esto,
  // logoutear en tab A dejaba a tab B con la sesión "viva" (cache + user
  // en memoria) hasta el próximo request, que recién ahí daba 401.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'gestionproyectos:auth-user') return;
      // newValue null → la otra pestaña hizo signOut.
      // newValue distinto al actual → otro usuario se logueó en otra tab.
      if (e.newValue === null) {
        setAccessToken(null);
        setUser(null);
        return;
      }
      try {
        const next = JSON.parse(e.newValue) as { id: number };
        if (!user || user.id !== next.id) {
          // Cambió el usuario en otra tab — recargamos para arrancar
          // limpios con el nuevo (refresh + me + tree del nuevo user).
          window.location.reload();
        }
      } catch {
        // Cache corrupto en otra tab → forzamos logout local también.
        setAccessToken(null);
        setUser(null);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [user, setAccessToken]);

  // Registramos los hooks con el cliente HTTP DURANTE EL RENDER, no en
  // useEffect.  React corre los efectos children-first: si lo dejamos
  // en useEffect, los hijos (NavigationProvider, UsersPage,
  // InactivityGuard) ya dispararon sus fetches sin handler registrado
  // → el http no puede hacer refresh proactivo y se mete en 401s.
  // Setters idempotentes (sólo guardan una referencia) → seguro llamarlos
  // en cada render con callbacks estables (useCallback).
  setAccessTokenGetter(getAccessToken);
  setUnauthorizedHandler(() => refreshSession());

  const value: AuthContextValue = {
    user,
    loading,
    signIn,
    signInWithGoogle,
    signOut,
    getAccessToken,
    refreshSession
  };

  // Mientras chequeamos la cookie/refresh al cargar, tapamos toda la app
  // con el ViewSkeleton — un placeholder que mira la ruta y dibuja la
  // silueta de la vista que viene (login o dashboard). Así ningún
  // consumidor (ProtectedRoute, páginas, etc.) necesita manejar este
  // caso por su cuenta — el auth ya lo cubre.
  return (
    <AuthContext.Provider value={value}>
      {loading ? <ViewSkeleton /> : children}
    </AuthContext.Provider>
  );
}
