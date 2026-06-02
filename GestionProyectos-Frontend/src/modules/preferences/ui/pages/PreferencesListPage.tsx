import { useEffect, useState } from 'react';
import { usePreferences } from '../hooks/usePreferences.js';
import PreferencesList from '../components/PreferencesList.js';
import type { Preferences } from '../../domain/preferences.entity.js';
import type { PaginatedResult } from '../../ports/preferences.repository.js';

export default function PreferencesListPage() {
  const { list } = usePreferences();
  const [data, setData] = useState<PaginatedResult<Preferences>>({
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
  return <PreferencesList items={data.items} />;
}
