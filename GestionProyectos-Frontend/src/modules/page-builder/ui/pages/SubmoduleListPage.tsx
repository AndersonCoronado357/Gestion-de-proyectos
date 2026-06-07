// Vista intermedia entre "Módulos y submódulos" (árbol) y el Hub de
// editor de un submódulo. Muestra la lista de submódulos en edición
// (sus design_projects), permite crear uno nuevo y entrar a editarlo.

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../../shared/lib/cn.js';
import Button from '../../../../shared/components/Button/index.js';
import Input from '../../../../shared/components/Input/index.js';
import EmptyState from '../../../../shared/components/EmptyState/index.js';
import Skeleton from '../../../../shared/components/Skeleton/index.js';
import {
  ChevronRightIcon,
  LayoutIcon,
  PlusIcon,
  TrashIcon
} from '../../../../shared/icons/index.js';
import { useToast } from '../../../../shared/components/Toast/index.js';
import { useDesignsList } from '../../../design/ui/hooks/useDesignsList.js';
import { scaffoldSubmodule } from '../../api.js';
import { appLog } from '../../../logs/logger.js';

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

export default function SubmoduleListPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const list = useDesignsList();
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async (): Promise<void> => {
    const n = newName.trim();
    if (!n || creating) return;
    setCreating(true);
    try {
      // Primero generamos los archivos en disco (clon de module-x).
      // Si ya existían (409) el helper devuelve null y seguimos solo
      // con el design_project — esto cubre el caso de reabrir un
      // submódulo que ya fue creado antes.
      await scaffoldSubmodule(n);
      const p = await list.create(n);
      setNewName('');
      // Soft-nav (React Router): conserva la sesión, AuthContext, cache
      // de navegación y bundles ya cargados — no hay reload del browser
      // así nada puede "rebotar" a la lista por un useEffect que se
      // remonta o un bundle stale.  Pasamos el proyecto recién creado
      // por `state` para que el Hub pinte instantáneo sin esperar al
      // GET /design/projects/:id.
      if (p) navigate(`/administracion/submodulos/${p.id}`, {
        replace: true,
        state: { project: p }
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Inténtalo de nuevo.';
      toast.error({ title: 'No se pudo crear', message: msg });
      appLog.error(`No se pudo crear submódulo: ${msg}`, {
        category: 'app',
        loggerName: 'SubmoduleListPage.handleCreate',
        stackTrace: e instanceof Error ? e.stack ?? null : null,
        context: { name: n }
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex h-full overflow-hidden p-3 sm:p-4 lg:p-6">
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-bg shadow-sm">
        <div className="shrink-0 px-5 pt-5 pb-2">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
            Submódulos
          </p>
          <h2 className="text-[18px] font-bold tracking-tight text-fg">
            Editor de submódulos
          </h2>
          <p className="mt-0.5 text-[11px] text-fg-faint">
            {list.loading
              ? ''
              : `${list.items.length} submódulo${list.items.length === 1 ? '' : 's'} en edición`}
          </p>
        </div>

        <div className="shrink-0 px-5 pb-3">
          <div className="rounded-xl bg-bg-muted p-3">
            <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
              Crear nuevo
            </p>
            <div className="flex flex-wrap items-start gap-2">
              <div className="min-w-[200px] flex-1">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleCreate();
                  }}
                  placeholder="Nombre del submódulo (ej. Notificaciones)"
                />
              </div>
              <Button
                type="button"
                variant="primary"
                size="md"
                disabled={!newName.trim() || creating}
                onClick={() => void handleCreate()}
                leftIcon={<PlusIcon width={13} height={13} />}
              >
                {creating ? 'Creando…' : 'Nuevo submódulo'}
              </Button>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5">
          {list.loading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} variant="rect" width="100%" height={110} />
              ))}
            </div>
          ) : list.error ? (
            <div className="text-[12px] text-danger-text">{list.error}</div>
          ) : list.items.length === 0 ? (
            <EmptyState
              icon={<LayoutIcon width={22} height={22} />}
              title="No hay submódulos en edición"
              description="Crea uno arriba para empezar."
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.items.map((p) => (
                <div
                  key={p.id}
                  className={cn(
                    'group relative flex items-stretch gap-3 rounded-xl bg-bg-muted p-3 transition-colors hover:bg-bg-muted/70'
                  )}
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/administracion/submodulos/${p.id}`)}
                    className="absolute inset-0 rounded-xl outline-none"
                    aria-label={`Abrir ${p.name}`}
                  />
                  <div className="pointer-events-none flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-bg text-fg-faint shadow-sm">
                    <LayoutIcon width={22} height={22} />
                  </div>
                  <div className="pointer-events-none flex min-w-0 flex-1 flex-col justify-center">
                    <p className="truncate text-[13px] font-semibold text-fg">{p.name}</p>
                    <p className="truncate text-[10.5px] text-fg-faint">
                      Modificado {formatDate(p.updatedAt)}
                    </p>
                  </div>
                  <div className="relative z-10 flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (
                          window.confirm(
                            `¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`
                          )
                        ) {
                          await list.remove(p.id);
                        }
                      }}
                      title="Eliminar"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-faint outline-none hover:bg-danger-surface hover:text-danger-text"
                    >
                      <TrashIcon width={12} height={12} />
                    </button>
                    <ChevronRightIcon
                      width={14}
                      height={14}
                      className="text-fg-faint"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
