// Hook utilitario para que cualquier módulo nuevo se enganche al
// buscador global del header sin escribir lógica de filtrado.
//
// Uso:
//
//   const filteredPatients = useFilteredList(
//     patients,
//     (p) => [p.firstName, p.lastName, p.email, p.dni]
//   );
//
// Si el header está vacío devuelve la lista completa.  Si hay query,
// filtra por cualquiera de los campos que devuelva el selector.

import { useMemo } from 'react';
import { matchesQuery, useSearchQuery } from './SearchContext.js';

export function useFilteredList<T>(
  items: T[],
  getSearchableFields: (item: T) => string | Array<string | null | undefined>
): T[] {
  const query = useSearchQuery();
  return useMemo(() => {
    if (!query.trim()) return items;
    return items.filter((item) => {
      const fields = getSearchableFields(item);
      const list = Array.isArray(fields) ? fields : [fields];
      return list.some((f) => matchesQuery(f, query));
    });
  }, [items, query, getSearchableFields]);
}
