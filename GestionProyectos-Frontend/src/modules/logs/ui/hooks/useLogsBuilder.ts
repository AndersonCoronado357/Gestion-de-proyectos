// Hook builder de la página de Logs: estado de filtros + carga paginada
// + auto-refresh + selección de detalle. Mantiene la lista en RAM y la
// re-pide cuando cambian filtros, página o intervalo.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchLogDetail,
  fetchLogSummary,
  listLogs,
  type LogCategory,
  type LogDetail,
  type LogFilters,
  type LogLevel,
  type LogListResult,
  type LogSource,
  type LogSummary,
  type RemoteLogEntry
} from '../../api.js';

export interface LogsFiltersState {
  levels: LogLevel[];
  sources: LogSource[];
  categories: LogCategory[];
  search: string;
  page: number;
  pageSize: number;
  /** Auto-refresco en segundos (0 = manual). */
  autoRefreshSec: number;
}

const INITIAL_FILTERS: LogsFiltersState = {
  levels: [],
  sources: [],
  categories: [],
  search: '',
  page: 1,
  pageSize: 50,
  autoRefreshSec: 0
};

export function useLogsBuilder() {
  const [filters, setFilters] = useState<LogsFiltersState>(INITIAL_FILTERS);
  const [list, setList] = useState<LogListResult>({ items: [], total: 0 });
  const [summary, setSummary] = useState<LogSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<LogDetail | null>(null);
  const [selectedLoading, setSelectedLoading] = useState(false);
  const inFlight = useRef(0);

  const queryFilters: LogFilters = useMemo(
    () => ({
      levels: filters.levels.length ? filters.levels : undefined,
      sources: filters.sources.length ? filters.sources : undefined,
      categories: filters.categories.length ? filters.categories : undefined,
      search: filters.search.trim() || undefined,
      limit: filters.pageSize,
      offset: (filters.page - 1) * filters.pageSize
    }),
    [filters]
  );

  const refresh = useCallback(
    async (silent = false) => {
      const ticket = ++inFlight.current;
      if (!silent) setRefreshing(true);
      try {
        const [items, sm] = await Promise.all([listLogs(queryFilters), fetchLogSummary()]);
        if (ticket !== inFlight.current) return;
        setList(items);
        setSummary(sm);
        setError(null);
      } catch (e) {
        if (ticket !== inFlight.current) return;
        setError(e instanceof Error ? e.message : 'Error cargando la bitácora');
      } finally {
        if (ticket === inFlight.current) {
          setRefreshing(false);
          setLoading(false);
        }
      }
    },
    [queryFilters]
  );

  // Cargar / re-cargar cuando cambian los filtros.
  useEffect(() => {
    void refresh();
  }, [refresh]);

  // Auto-refresh.
  useEffect(() => {
    if (filters.autoRefreshSec <= 0) return;
    const ms = filters.autoRefreshSec * 1000;
    const id = setInterval(() => void refresh(true), ms);
    return () => clearInterval(id);
  }, [filters.autoRefreshSec, refresh]);

  const selectLog = useCallback(async (entry: RemoteLogEntry | null) => {
    if (!entry || !entry.id) {
      setSelected(null);
      return;
    }
    setSelectedLoading(true);
    try {
      const detail = await fetchLogDetail(entry.id);
      setSelected(detail);
    } catch {
      setSelected({ entry, related: [] });
    } finally {
      setSelectedLoading(false);
    }
  }, []);

  const setFilter = useCallback(<K extends keyof LogsFiltersState>(
    key: K,
    value: LogsFiltersState[K]
  ) => {
    setFilters((f) => ({ ...f, [key]: value, page: key === 'page' ? (value as number) : 1 }));
  }, []);

  const totalPages = Math.max(1, Math.ceil(list.total / filters.pageSize));

  return {
    filters,
    setFilter,
    list,
    summary,
    loading,
    refreshing,
    error,
    refresh: () => refresh(false),
    selected,
    selectedLoading,
    selectLog,
    closeDetail: () => setSelected(null),
    totalPages
  };
}
