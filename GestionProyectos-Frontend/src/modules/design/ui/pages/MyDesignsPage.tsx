// "Mis diseños" — antes de entrar al editor.
// Lista los proyectos persistidos en BD con su nombre, fecha de último
// cambio y acciones (renombrar, eliminar). Botón inline arriba para
// crear uno nuevo (pide nombre y entra al editor).

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../../shared/lib/cn.js';
import EmptyState from '../../../../shared/components/EmptyState/index.js';
import Skeleton from '../../../../shared/components/Skeleton/index.js';
import Button from '../../../../shared/components/Button/index.js';
import Input from '../../../../shared/components/Input/index.js';
import {
  CheckIcon,
  LayoutIcon,
  TrashIcon,
  XIcon
} from '../../../../shared/icons/index.js';
import NewDesignInline from '../components/NewDesignInline.js';
import { useDesignsList } from '../hooks/useDesignsList.js';

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString('es-CO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

export default function MyDesignsPage() {
  const b = useDesignsList();
  const navigate = useNavigate();
  const [renameId, setRenameId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const startRename = (id: number, current: string): void => {
    setRenameId(id);
    setRenameValue(current);
  };

  const commitRename = async (): Promise<void> => {
    if (renameId == null) return;
    const n = renameValue.trim();
    if (n) await b.rename(renameId, n);
    setRenameId(null);
  };

  const handleCreate = async (name: string): Promise<void> => {
    const p = await b.create(name);
    if (p) navigate(`/administracion/diseno/${p.id}`);
  };

  return (
    <div className="flex h-full overflow-hidden p-3 sm:p-4 lg:p-8">
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-bg shadow-sm">
        <div className="shrink-0 px-4 pt-4 pb-1 sm:px-5 sm:pt-5">
          <h2 className="text-[18px] font-bold tracking-tight text-fg">Mis diseños</h2>
          {b.loading ? (
            <Skeleton variant="text" width={160} height={11} className="mt-0.5" />
          ) : (
            <p
              className={cn(
                'mt-0.5 text-[11px]',
                b.error ? 'text-danger-text' : 'text-fg-faint'
              )}
            >
              {b.error
                ? b.error
                : `${b.items.length} diseño${b.items.length === 1 ? '' : 's'} guardado${b.items.length === 1 ? '' : 's'}`}
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="flex flex-col gap-4">
            <NewDesignInline busy={b.busy} onCreate={handleCreate} />

            {b.loading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} variant="rect" width="100%" height={130} />
                ))}
              </div>
            ) : b.items.length === 0 ? (
              <EmptyState
                icon={<LayoutIcon width={22} height={22} />}
                title="Aún no tienes diseños"
                description="Crea uno arriba para empezar a armar el front del módulo."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {b.items.map((p) => {
                  const renaming = renameId === p.id;
                  return (
                    <div
                      key={p.id}
                      className="group relative flex flex-col gap-2 rounded-xl bg-bg-muted p-3 transition-colors hover:bg-bg-muted/70"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          if (renaming) return;
                          navigate(`/administracion/diseno/${p.id}`);
                        }}
                        className="absolute inset-0 rounded-xl outline-none"
                        aria-label={`Abrir ${p.name}`}
                      />

                      {/* Miniatura placeholder. Más adelante puede mostrar
                          el thumbnail real renderizado desde el layout. */}
                      <div className="pointer-events-none flex h-20 w-full items-center justify-center rounded-lg bg-bg text-fg-faint shadow-sm">
                        <LayoutIcon width={26} height={26} />
                      </div>

                      <div className="relative z-10 flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          {renaming ? (
                            <Input
                              autoFocus
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') void commitRename();
                                if (e.key === 'Escape') setRenameId(null);
                              }}
                            />
                          ) : (
                            <p className="truncate text-[13px] font-semibold text-fg">
                              {p.name}
                            </p>
                          )}
                          {!renaming && (
                            <p className="mt-0.5 truncate text-[10.5px] text-fg-faint">
                              Modificado {formatDate(p.updatedAt)}
                            </p>
                          )}
                        </div>

                        {/* Acciones (renombrar / eliminar). Quedan por encima
                            del botón overlay para recibir click. */}
                        <div className="relative z-10 flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                          {renaming ? (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void commitRename();
                                }}
                                leftIcon={<CheckIcon width={12} height={12} />}
                              >
                                Guardar
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setRenameId(null);
                                }}
                                leftIcon={<XIcon width={12} height={12} />}
                              >
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startRename(p.id, p.name);
                                }}
                              >
                                Renombrar
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  if (
                                    window.confirm(
                                      `¿Eliminar el diseño "${p.name}"? Esta acción no se puede deshacer.`
                                    )
                                  ) {
                                    await b.remove(p.id);
                                  }
                                }}
                                leftIcon={<TrashIcon width={12} height={12} />}
                              >
                                Eliminar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
