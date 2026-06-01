// Búsqueda de contenido GENERAL.
//
// Engancha el buscador del header a CUALQUIER módulo SIN tocar su código: al
// escribir, esconde —dentro del área de contenido— las "filas" (filas de
// tabla e items de lista) cuyo texto no coincide con la query. Se monta UNA
// sola vez en el Layout, así ningún módulo necesita wiring propio.
//
// Componentes que ya filtran/paginan solos (DataTable, SimpleTable) se marcan
// con `data-search-skip` y se ignoran aquí para no romper su paginación.
//
// Si algún control usa <li> que NO es una lista de datos (p.ej. tabs), basta
// con ponerle `data-search-skip` para excluirlo.

import { useEffect } from 'react';
import { useSearchQuery } from './SearchContext.js';

const ROW_SELECTOR = 'tbody > tr, ul > li, ol > li, [data-search-item]';

export interface GlobalContentSearchProps {
  /** id del contenedor cuyo contenido se filtra (normalmente el <main>). */
  targetId: string;
}

export default function GlobalContentSearch({
  targetId
}: GlobalContentSearchProps) {
  const query = useSearchQuery();

  useEffect(() => {
    const root = document.getElementById(targetId);
    if (!root) return;
    const q = query.trim().toLowerCase();

    const apply = () => {
      const rows = root.querySelectorAll<HTMLElement>(ROW_SELECTOR);
      rows.forEach((el) => {
        // Respeta subárboles que filtran/paginan por su cuenta.
        if (el.closest('[data-search-skip]')) return;
        // Sólo filtramos HOJAS: si una fila contiene otras filas (lista
        // anidada) no la escondemos por su contenedor.
        if (el.querySelector(ROW_SELECTOR)) return;
        if (!q) {
          el.style.removeProperty('display');
          return;
        }
        const text = (el.textContent ?? '').toLowerCase();
        el.style.display = text.includes(q) ? '' : 'none';
      });
    };

    apply();
    if (!q) return;

    // Re-aplica cuando el contenido cambia (carga async / re-render). Sólo
    // observamos childList: cambiar `display` es un cambio de atributo, así
    // que NO se re-dispara a sí mismo (no hay bucle).
    const obs = new MutationObserver(() => apply());
    obs.observe(root, { childList: true, subtree: true });
    return () => obs.disconnect();
  }, [query, targetId]);

  return null;
}
