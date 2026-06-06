import { useEffect, useState } from 'react';
import { useAnder } from '../hooks/useAnder.js';
import AnderList from '../components/AnderList.js';
import type { Ander } from '../../domain/ander.entity.js';
import type { PaginatedResult } from '../../ports/ander.repository.js';

export default function AnderListPage() {
  const { list } = useAnder();
  const [data, setData] = useState<PaginatedResult<Ander>>({
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
  return <AnderList items={data.items} />;
}
