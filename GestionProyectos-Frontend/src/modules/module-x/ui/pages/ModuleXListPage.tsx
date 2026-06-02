import { useEffect, useState } from 'react';
import { useModuleX } from '../hooks/useModuleX.js';
import ModuleXList from '../components/ModuleXList.js';
import type { ModuleX } from '../../domain/module-x.entity.js';
import type { PaginatedResult } from '../../ports/module-x.repository.js';

export default function ModuleXListPage() {
  const { list } = useModuleX();
  const [data, setData] = useState<PaginatedResult<ModuleX>>({
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
  return <ModuleXList items={data.items} />;
}
