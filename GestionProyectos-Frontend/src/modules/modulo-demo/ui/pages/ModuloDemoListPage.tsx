import { useEffect, useState } from 'react';
import { useModuloDemo } from '../hooks/useModuloDemo.js';
import ModuloDemoList from '../components/ModuloDemoList.js';
import type { ModuloDemo } from '../../domain/modulo-demo.entity.js';
import type { PaginatedResult } from '../../ports/modulo-demo.repository.js';

export default function ModuloDemoListPage() {
  const { list } = useModuloDemo();
  const [data, setData] = useState<PaginatedResult<ModuloDemo>>({
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
  return <ModuloDemoList items={data.items} />;
}
