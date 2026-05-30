// Caché de cliente sobre IndexedDB — reemplaza a localStorage para datos no
// sensibles (sesión, árbol de navegación) y es la base para cachear
// consultas pesadas a la DB (ver queryCache.ts).
//
// Por qué IndexedDB y NO localStorage:
//   - Asíncrono → no bloquea el hilo principal (localStorage es síncrono).
//   - Capacidad grande (cientos de MB vs ~5 MB) → apto para "muchos datos".
//   - Guarda objetos estructurados (structured clone) sin serializar a mano.
//
// Mantiene un espejo en memoria (`mem`) para que las lecturas repetidas
// dentro de la misma sesión sean instantáneas y no peguen a IndexedDB cada
// vez.

const DB_NAME = 'gp-cache';
const STORE = 'kv';
const VERSION = 1;

export interface CacheEntry<T> {
  value: T;
  ts: number; // epoch ms en que se guardó (para TTL / stale-while-revalidate)
}

const mem = new Map<string, CacheEntry<unknown>>();

let dbPromise: Promise<IDBDatabase | null> | null = null;

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (typeof indexedDB === 'undefined') return resolve(null);
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        if (!req.result.objectStoreNames.contains(STORE)) {
          req.result.createObjectStore(STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

// Abrimos la DB cuanto antes (al importar el módulo) para que la primera
// lectura del arranque no tenga que esperar el handshake de apertura.
void openDb();

function run<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest
): Promise<T | null> {
  return openDb().then(
    (db) =>
      new Promise<T | null>((resolve) => {
        if (!db) return resolve(null);
        try {
          const tx = db.transaction(STORE, mode);
          const req = fn(tx.objectStore(STORE));
          req.onsuccess = () => resolve(req.result as T);
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      })
  );
}

/** Devuelve la entrada completa (value + ts). Mira primero el espejo. */
export async function idbGetEntry<T>(key: string): Promise<CacheEntry<T> | null> {
  const cached = mem.get(key) as CacheEntry<T> | undefined;
  if (cached) return cached;
  const entry = await run<CacheEntry<T>>('readonly', (s) => s.get(key));
  if (entry && typeof entry.ts === 'number') {
    mem.set(key, entry);
    return entry;
  }
  return null;
}

/** Devuelve sólo el valor (o null si no existe). */
export async function idbGet<T>(key: string): Promise<T | null> {
  const entry = await idbGetEntry<T>(key);
  return entry ? entry.value : null;
}

export async function idbSet<T>(key: string, value: T): Promise<void> {
  const entry: CacheEntry<T> = { value, ts: Date.now() };
  mem.set(key, entry);
  await run('readwrite', (s) => s.put(entry, key));
}

export async function idbDel(key: string): Promise<void> {
  mem.delete(key);
  await run('readwrite', (s) => s.delete(key));
}

export async function idbClear(): Promise<void> {
  mem.clear();
  await run('readwrite', (s) => s.clear());
}

/** Pre-carga claves al espejo en memoria → lecturas posteriores instantáneas. */
export function idbWarm(...keys: string[]): void {
  for (const k of keys) void idbGet(k);
}
