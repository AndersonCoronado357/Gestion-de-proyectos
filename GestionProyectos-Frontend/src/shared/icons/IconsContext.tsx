// Carga la biblioteca de iconos desde la BASE DE DATOS (tabla `icons`) y la
// expone como mapa nombre→svg. Es la única fuente de iconos de la app.
//
// El endpoint es público (la pantalla de login necesita iconos antes de
// autenticarse). Cache a nivel de módulo para no re-fetchear en cada montaje
// dentro de la misma sesión de página.

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from 'react';
import { http } from '../utils/http.js';

interface IconRow {
  id: number;
  name: string | null;
  svg: string;
}

let cache: Map<string, string> | null = null;

const IconsContext = createContext<Map<string, string>>(new Map());

export function IconsProvider({ children }: { children: ReactNode }) {
  const [map, setMap] = useState<Map<string, string>>(() => cache ?? new Map());

  useEffect(() => {
    if (cache) return; // ya cargado en esta sesión
    let alive = true;
    http<{ icons: IconRow[] }>('/navigation/icons', { skipAuthRefresh: true })
      .then((d) => {
        const m = new Map<string, string>();
        (d?.icons ?? []).forEach((ic) => {
          if (ic.name) m.set(ic.name, ic.svg);
        });
        cache = m;
        if (alive) setMap(m);
      })
      .catch(() => {
        /* sin conexión → los iconos se ven vacíos hasta el próximo intento */
      });
    return () => {
      alive = false;
    };
  }, []);

  return <IconsContext.Provider value={map}>{children}</IconsContext.Provider>;
}

export function useIconSvg(name: string): string | undefined {
  return useContext(IconsContext).get(name);
}
