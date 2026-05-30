// Caché de consultas con estrategia stale-while-revalidate sobre IndexedDB.
//
// Pensado para CONSULTAS PESADAS a la DB (listados grandes, catálogos, etc.):
// la próxima vez que se piden, se sirven al instante desde el caché local y,
// si ya están "viejas", se revalidan contra la DB en segundo plano.
//
// Uso típico en un hook/use-case:
//
//   const proyectos = await cachedQuery(
//     `proyectos:${filtro}`,
//     () => http('/proyectos?...'),         // el fetch real a la DB
//     { ttlMs: 5 * 60_000, onData: setProyectos }
//   );
//
//   // tras crear/editar/borrar:
//   await invalidateQuery(`proyectos:${filtro}`);

import { idbGetEntry, idbSet, idbDel } from './idb.js';

export interface CachedQueryOptions<T> {
  /** Edad máxima (ms) para considerar el caché "fresco". Sin valor = nunca vence. */
  ttlMs?: number;
  /** Revalidar en background cuando el caché está vencido (default: true). */
  revalidate?: boolean;
  /** Se llama con la data fresca cuando termina una revalidación en background. */
  onData?: (fresh: T) => void;
}

/**
 * Devuelve datos cacheados al instante y, si hace falta, revalida contra la DB.
 *
 *  - Caché fresco (dentro de ttl)  → lo devuelve sin tocar la red.
 *  - Caché vencido                 → lo devuelve YA y revalida en background
 *                                    (llamando `onData` con el resultado fresco).
 *  - Sin caché                     → hace el fetch, lo guarda y lo devuelve.
 */
export async function cachedQuery<T>(
  key: string,
  fetcher: () => Promise<T>,
  opts: CachedQueryOptions<T> = {}
): Promise<T> {
  const { ttlMs, revalidate = true, onData } = opts;
  const entry = await idbGetEntry<T>(key);

  if (entry) {
    const isFresh = ttlMs == null || Date.now() - entry.ts < ttlMs;
    if (!isFresh && revalidate) {
      // Vencido → servimos el viejo y revalidamos en segundo plano.
      void fetcher()
        .then((fresh) => {
          void idbSet(key, fresh);
          onData?.(fresh);
        })
        .catch(() => {
          /* si la red falla, conservamos el caché viejo */
        });
    }
    return entry.value;
  }

  // Sin caché → fetch directo y guardamos.
  const fresh = await fetcher();
  void idbSet(key, fresh);
  return fresh;
}

/** Invalida una entrada del caché (p. ej. tras un POST/PUT/DELETE que la cambia). */
export async function invalidateQuery(key: string): Promise<void> {
  await idbDel(key);
}
