// Lista de proyectos del Diseñador. Crear / renombrar / borrar.

import { useCallback, useEffect, useState } from 'react';
import {
  createProject,
  deleteProject,
  listProjects,
  renameProject,
  type DesignProject
} from '../../api.js';

export function useDesignsList() {
  const [items, setItems] = useState<DesignProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const list = await listProjects();
      setItems(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando proyectos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const create = useCallback(
    async (name: string): Promise<DesignProject | null> => {
      setBusy(true);
      try {
        const p = await createProject(name);
        await refresh();
        return p;
      } finally {
        setBusy(false);
      }
    },
    [refresh]
  );

  const rename = useCallback(
    async (id: number, name: string): Promise<void> => {
      setBusy(true);
      try {
        await renameProject(id, name);
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [refresh]
  );

  const remove = useCallback(
    async (id: number): Promise<void> => {
      setBusy(true);
      try {
        await deleteProject(id);
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [refresh]
  );

  return { items, loading, busy, error, refresh, create, rename, remove };
}
