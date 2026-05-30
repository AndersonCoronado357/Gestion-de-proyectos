// Búsqueda global controlada desde el SearchInput del Header.
//
//   - El header escribe al contexto.
//   - Cualquier componente "filtreable" (DataTable, listas, paletas,
//     sidebar) lee el query con `useSearchQuery()` y filtra su data.
//   - La query se resetea automáticamente al cambiar de ruta — el filtro
//     no se "lleva" entre páginas, lo cual sería confuso (escribís
//     "users" en /administracion/usuarios y al ir a /componentes seguiría
//     escondiendo cosas).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import { useLocation } from 'react-router-dom';

export interface SearchContextValue {
  query: string;
  setQuery: (q: string) => void;
  clear: () => void;
}

const SearchContext = createContext<SearchContextValue | null>(null);

/** Hook principal — devuelve el query y los setters. */
export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error('useSearch fuera de <SearchProvider>');
  return ctx;
}

/**
 * Atajo para los componentes que sólo necesitan filtrar.
 *
 *   const q = useSearchQuery();
 *   const filtered = data.filter(row => match(row, q));
 */
export function useSearchQuery(): string {
  return useSearch().query;
}

export interface SearchProviderProps {
  children: ReactNode;
}

export function SearchProvider({ children }: SearchProviderProps) {
  const [query, setQueryState] = useState('');
  const location = useLocation();

  // Reset al navegar — la búsqueda es por-vista, no global persistente.
  useEffect(() => {
    setQueryState('');
  }, [location.pathname]);

  const setQuery = useCallback((q: string) => setQueryState(q), []);
  const clear = useCallback(() => setQueryState(''), []);

  const value = useMemo<SearchContextValue>(
    () => ({ query, setQuery, clear }),
    [query, setQuery, clear]
  );

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

/**
 * Helper standalone para hacer matching consistente en todos los lugares.
 * Normaliza minúsculas y trim, y si la query está vacía siempre matchea.
 */
export function matchesQuery(haystack: string | null | undefined, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (haystack ?? '').toLowerCase().includes(q);
}
