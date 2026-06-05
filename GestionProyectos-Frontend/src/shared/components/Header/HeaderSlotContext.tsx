// Slots opcionales del header de la app.
//
// Arquitectura: DOS contextos separados.
//   - ApiCtx: setters estables (jamás cambian de referencia).
//   - StateCtx: estado actual de los slots, lo consume sólo Header.
// Así, una página que inyecta un slot (vía useHeaderSlot) NO se re-renderea
// cuando el estado del slot cambia, evitando el loop infinito que se
// daba antes (setState → re-render → factory nuevo → setState → ...).

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from 'react';

interface HeaderSlotState {
  leading: ReactNode | null;
  trailing: ReactNode | null;
}

interface HeaderSlotApi {
  setLeading: (node: ReactNode | null) => void;
  setTrailing: (node: ReactNode | null) => void;
}

const ApiCtx = createContext<HeaderSlotApi | null>(null);
const StateCtx = createContext<HeaderSlotState>({ leading: null, trailing: null });

export function HeaderSlotProvider({ children }: { children: ReactNode }) {
  const [leading, setLeading] = useState<ReactNode | null>(null);
  const [trailing, setTrailing] = useState<ReactNode | null>(null);
  // Los setters de useState son referencialmente estables → el api jamás
  // cambia, así que los consumidores que sólo necesitan setear NUNCA se
  // re-renderean por cambios de estado.
  const api = useMemo<HeaderSlotApi>(() => ({ setLeading, setTrailing }), []);
  const state = useMemo<HeaderSlotState>(() => ({ leading, trailing }), [leading, trailing]);
  return (
    <ApiCtx.Provider value={api}>
      <StateCtx.Provider value={state}>{children}</StateCtx.Provider>
    </ApiCtx.Provider>
  );
}

/** Sólo Header lee esto. */
export function useHeaderSlots(): HeaderSlotState {
  return useContext(StateCtx);
}

/**
 * Inyecta un slot mientras el componente esté montado.
 *
 * El factory se invoca dentro del effect; sólo se re-ejecuta cuando
 * cambian las `deps` que el caller declare. Internamente usamos refs
 * para que el callsite NO se re-renderee cuando el estado de los slots
 * cambia.
 */
export function useHeaderSlot(
  position: 'leading' | 'trailing',
  factory: () => ReactNode | null,
  deps: ReadonlyArray<unknown>
): void {
  const api = useContext(ApiCtx);
  const apiRef = useRef(api);
  apiRef.current = api;
  const factoryRef = useRef(factory);
  factoryRef.current = factory;

  useEffect(() => {
    const cur = apiRef.current;
    if (!cur) return;
    const set = position === 'leading' ? cur.setLeading : cur.setTrailing;
    set(factoryRef.current());
    return () => {
      const c = apiRef.current;
      if (!c) return;
      const s = position === 'leading' ? c.setLeading : c.setTrailing;
      s(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
