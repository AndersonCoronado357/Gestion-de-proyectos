// Tester básico de Google Tasks — listas + tareas con toggle de estado.

import { useCallback, useEffect, useState } from 'react';
import Button from '../../../../shared/components/Button/index.js';
import EmptyState from '../../../../shared/components/EmptyState/index.js';
import Select from '../../../../shared/components/Select/index.js';
import { useToast } from '../../../../shared/components/Toast/index.js';
import { CheckIcon } from '../../../../shared/icons/index.js';
import { cn } from '../../../../shared/lib/cn.js';
import GoogleConnectionPanel from '../../../google-connection/ui/components/GoogleConnectionPanel.js';
import { googleTasksHttp } from '../../adapters/exit/google-tasks.http.adapter.js';
import type {
  TaskItem,
  TaskListSummary
} from '../../domain/google-tasks.types.js';

export default function GoogleTasksListPage() {
  const [connected, setConnected] = useState<boolean | null>(null);
  if (connected !== true) {
    return (
      <div className="flex h-full overflow-hidden p-3 sm:p-4 lg:p-6">
        <div className="flex h-full min-w-0 flex-1 items-center justify-center rounded-xl bg-bg shadow-sm">
          <GoogleConnectionPanel variant="empty" onChange={setConnected} />
        </div>
      </div>
    );
  }
  return <Shell />;
}

function Shell() {
  const toast = useToast();
  const [lists, setLists] = useState<TaskListSummary[]>([]);
  const [listId, setListId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLists = useCallback(async () => {
    try {
      const all = await googleTasksHttp.listTaskLists();
      setLists(all);
      if (!listId && all.length > 0) setListId(all[0].id);
    } catch (e) {
      toast.error({
        title: 'No se pudieron cargar las listas',
        message: e instanceof Error ? e.message : ''
      });
    }
  }, [listId, toast]);

  const loadTasks = useCallback(async () => {
    if (!listId) return;
    setLoading(true);
    try {
      setTasks(await googleTasksHttp.listTasks(listId));
    } catch (e) {
      toast.error({
        title: 'No se pudieron cargar las tareas',
        message: e instanceof Error ? e.message : ''
      });
    } finally {
      setLoading(false);
    }
  }, [listId, toast]);

  useEffect(() => {
    void loadLists();
  }, [loadLists]);
  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const toggleDone = async (t: TaskItem): Promise<void> => {
    if (!listId) return;
    try {
      const updated = await googleTasksHttp.updateTask(listId, t.id, {
        status: t.status === 'completed' ? 'needsAction' : 'completed'
      });
      if (updated) {
        setTasks((prev) => prev.map((x) => (x.id === t.id ? updated : x)));
      }
    } catch (e) {
      toast.error({
        title: 'No se pudo actualizar',
        message: e instanceof Error ? e.message : ''
      });
    }
  };

  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden p-3 sm:p-4 lg:p-6">
      <div className="flex shrink-0 items-center gap-3 rounded-xl bg-bg px-4 py-3 shadow-sm">
        <p className="text-[13px] font-semibold text-fg">Tareas</p>
        <div className="min-w-[200px] max-w-xs flex-1">
          <Select<string>
            options={lists.map((l) => ({ value: l.id, label: l.title }))}
            value={listId}
            onChange={(v) => setListId(v ?? null)}
            placeholder="Lista"
            searchable
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="ml-auto"
          onClick={() => void loadTasks()}
        >
          Refrescar
        </Button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {loading ? (
          <p className="px-5 py-6 text-center text-[12px] text-fg-faint">Cargando…</p>
        ) : tasks.length === 0 ? (
          <EmptyState title="Sin tareas" description="Esta lista no tiene tareas." />
        ) : (
          tasks.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-xl bg-bg px-5 py-3 shadow-sm transition-colors duration-200 hover:bg-primary-50 dark:hover:bg-primary-500/10"
            >
              <button
                type="button"
                onClick={() => void toggleDone(t)}
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                  t.status === 'completed'
                    ? 'border-primary bg-primary text-on-primary'
                    : 'border-fg-faint hover:border-primary'
                )}
                aria-label="Toggle completado"
              >
                {t.status === 'completed' && <CheckIcon width={11} height={11} />}
              </button>
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    'truncate text-[13px] font-semibold',
                    t.status === 'completed'
                      ? 'text-fg-faint line-through'
                      : 'text-fg'
                  )}
                >
                  {t.title || '(sin título)'}
                </p>
                {t.notes && <p className="truncate text-[11px] text-fg-muted">{t.notes}</p>}
              </div>
              {t.due && (
                <span className="shrink-0 text-[11px] text-fg-faint">
                  {new Date(t.due).toLocaleDateString('es-CO')}
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
