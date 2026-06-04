// Hook builder de la galería de iconos: lista, búsqueda, upload, rename, delete.
// Mantiene el estado en RAM y refresca el listado tras cualquier mutación.

import { useCallback, useEffect, useState } from 'react';
import {
  deleteIcon,
  listIcons,
  renameIcon,
  updateIconSvg,
  uploadIcon,
  type IconItem,
  type IconListResult
} from '../../api.js';

export function useIconsBuilder() {
  const [list, setList] = useState<IconListResult>({ items: [], total: 0 });
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<IconItem | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const result = await listIcons({ search: search.trim() || undefined, limit: 500 });
      setList(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando iconos');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const upload = useCallback(
    async (input: { name?: string | null; svg: string }) => {
      setBusy(true);
      try {
        const icon = await uploadIcon(input);
        await refresh();
        return icon;
      } finally {
        setBusy(false);
      }
    },
    [refresh]
  );

  const rename = useCallback(
    async (id: number, displayName: string | null) => {
      setBusy(true);
      try {
        const updated = await renameIcon(id, displayName);
        if (updated && selected?.id === id) setSelected(updated);
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [refresh, selected]
  );

  // Reemplaza el SVG de un icono. Usado por el editor realtime del panel
  // lateral (debounced). Si falla validación / duplicado, propaga el error.
  const updateSvg = useCallback(
    async (id: number, svg: string) => {
      const updated = await updateIconSvg(id, svg);
      if (updated && selected?.id === id) setSelected(updated);
      // Refresh sólo si afecta al orden / contadores (rara vez al editar svg).
      // No bloqueamos la UX con un refetch completo en cada tecla.
      return updated;
    },
    [selected]
  );

  const remove = useCallback(
    async (id: number) => {
      setBusy(true);
      try {
        await deleteIcon(id);
        if (selected?.id === id) setSelected(null);
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [refresh, selected]
  );

  return {
    list,
    search,
    setSearch,
    loading,
    busy,
    error,
    refresh,
    upload,
    rename,
    updateSvg,
    remove,
    selected,
    setSelected
  };
}
