// Escanea el src del frontend buscando referencias a iconos por nombre
// (`<XxxIcon` o `{ XxxIcon }` en imports). Devuelve un mapa
// nombre→cantidad de archivos donde aparece.
//
// Cacheado en memoria por 60s — el front cambia poco entre requests del
// admin de iconos, no hace falta re-escanear en cada pedido.

import fs from 'node:fs';
import path from 'node:path';

const FRONTEND_SRC = path.resolve(
  __dirname,
  '../../../../../GestionProyectos-Frontend/src'
);

// 5s — suficiente para amortiguar requests seguidos del admin sin
// quedarse stale cuando se editan archivos del front.
const CACHE_MS = 5_000;

interface CacheEntry {
  data: Map<string, IconUsage>;
  expiresAt: number;
}

export interface IconUsage {
  /** Cantidad de archivos donde aparece el icono. */
  count: number;
  /** Lista de paths relativos al src del frontend. */
  files: string[];
}

let cache: CacheEntry | null = null;

function walk(dir: string, out: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
      walk(full, out);
    } else if (
      e.isFile() &&
      (e.name.endsWith('.tsx') ||
        e.name.endsWith('.ts') ||
        e.name.endsWith('.jsx') ||
        e.name.endsWith('.js'))
    ) {
      // El index.tsx de iconos los DECLARA todos, no los USA. Lo
      // saltamos para no inflar la cuenta.
      if (full.replace(/\\/g, '/').endsWith('/shared/icons/index.tsx')) continue;
      out.push(full);
    }
  }
}

/** Patrón que matchea referencias a un componente Icon en JSX o imports. */
function build(): Map<string, IconUsage> {
  const map = new Map<string, IconUsage>();
  if (!fs.existsSync(FRONTEND_SRC)) return map;
  const files: string[] = [];
  walk(FRONTEND_SRC, files);

  // Regex global que captura cualquier nombre PascalCase terminado en
  // "Icon" usado como tag JSX (`<XxxIcon`) o destructurado en import
  // (`{ XxxIcon ` o `, XxxIcon `).
  const re = /(?:<|\{\s*|,\s*)([A-Z][A-Za-z0-9]+Icon)\b/g;

  for (const f of files) {
    let text: string;
    try {
      text = fs.readFileSync(f, 'utf8');
    } catch {
      continue;
    }
    // Iconos vistos en este archivo (set para no contar dos veces el
    // mismo icono dentro del mismo archivo).
    const seen = new Set<string>();
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(text)) !== null) {
      seen.add(m[1]);
    }
    const rel = path.relative(FRONTEND_SRC, f).replace(/\\/g, '/');
    for (const name of seen) {
      const entry = map.get(name) ?? { count: 0, files: [] };
      entry.count += 1;
      entry.files.push(rel);
      map.set(name, entry);
    }
  }
  return map;
}

export function getCodeUsage(): Map<string, IconUsage> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) return cache.data;
  const data = build();
  cache = { data, expiresAt: now + CACHE_MS };
  return data;
}
