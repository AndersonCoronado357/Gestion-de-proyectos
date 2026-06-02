import { useEffect, useState } from 'react';
import { useNavigation } from '../hooks/useNavigation.js';
import NavigationList from '../components/NavigationList.js';
import type { Navigation } from '../../domain/navigation.entity.js';
import type { PaginatedResult } from '../../ports/navigation.repository.js';

export default function NavigationListPage() {
  const { list } = useNavigation();
  const [data, setData] = useState<PaginatedResult<Navigation>>({
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
  return <NavigationList items={data.items} />;
}
