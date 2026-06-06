import { useEffect, useState } from 'react';
import { usePrueba } from '../hooks/usePrueba.js';
import PruebaList from '../components/PruebaList.js';
import type { Prueba } from '../../domain/prueba.entity.js';
import type { PaginatedResult } from '../../ports/prueba.repository.js';

export default function PruebaListPage() {
  const { list } = usePrueba();
  const [data, setData] = useState<PaginatedResult<Prueba>>({
    items: [],
    total: 0,
    page: 1,
    limit: 20
  });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<Error | null>(null);

  useEffect(() => {
    list({ page: 1, limit: 20 })
      .then(setData)
      .catch((e: unknown) =>
        setErr(e instanceof Error ? e : new Error(String(e)))
      )
      .finally(() => setLoading(false));
  }, [list]);

  if (loading) return <p>Cargando...</p>;
  if (err) return <p className="text-danger-text">{err.message}</p>;
  return <PruebaList items={data.items} />;
}
