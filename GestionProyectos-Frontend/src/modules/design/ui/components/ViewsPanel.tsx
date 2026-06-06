// Sección "Vistas" del panel izquierdo: lista de vistas del proyecto,
// renombrar inline, marcar inicial, REORDENAR drag, eliminar con Alert.

import { useState } from 'react';
import { cn } from '../../../../shared/lib/cn.js';
import { PlusIcon, TrashIcon } from '../../../../shared/icons/index.js';
import DragDropList from '../../../../shared/components/DragDropList/index.js';
import Alert from '../../../../shared/components/Alert/index.js';
import type { DesignView } from '../../api.js';

interface Props {
  views: DesignView[];
  activeViewId: number | null;
  primaryViewId: number | null;
  onSelect: (id: number) => void;
  onAdd: () => Promise<void> | void;
  onRename: (id: number, name: string) => Promise<void> | void;
  onRemove: (id: number) => Promise<void> | void;
  onSetPrimary: (id: number) => Promise<void> | void;
  /** Reordena vistas — recibe los views en el nuevo orden. */
  onReorder: (next: DesignView[]) => void;
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width={11}
      height={11}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinejoin="round"
    >
      <path d="M12 2 L14.91 8.41 22 9.27 16.73 14.14 18.18 21.02 12 17.27 5.82 21.02 7.27 14.14 2 9.27 9.09 8.41 Z" />
    </svg>
  );
}

export default function ViewsPanel({
  views,
  activeViewId,
  primaryViewId,
  onSelect,
  onAdd,
  onRename,
  onRemove,
  onSetPrimary,
  onReorder
}: Props) {
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDel, setConfirmDel] = useState<DesignView | null>(null);

  const commit = (): void => {
    if (renamingId == null) return;
    const v = renameValue.trim();
    if (v) void onRename(renamingId, v);
    setRenamingId(null);
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-2 pt-1 pb-1">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
          Vistas
        </p>
        <button
          type="button"
          onClick={() => void onAdd()}
          title="Nueva vista"
          className="inline-flex h-5 w-5 items-center justify-center rounded text-fg-muted outline-none hover:bg-bg-muted hover:text-fg"
        >
          <PlusIcon width={11} height={11} />
        </button>
      </div>

      <DragDropList
        items={views}
        getKey={(v) => String(v.id)}
        onReorder={(next) => onReorder(next)}
        renderItem={(v) => {
          const active = v.id === activeViewId;
          const primary = v.id === primaryViewId;
          const renaming = renamingId === v.id;
          if (renaming) {
            return (
              <input
                autoFocus
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') commit();
                  if (e.key === 'Escape') setRenamingId(null);
                }}
                className="h-6 w-full rounded-md bg-bg-muted px-1.5 text-[11.5px] outline-none"
              />
            );
          }
          return (
            <div
              className={cn(
                'group flex w-full items-center gap-1.5 rounded-md px-1.5 py-0.5 transition-colors',
                active ? 'text-fg' : 'text-fg-muted hover:text-fg'
              )}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void onSetPrimary(v.id);
                }}
                title={primary ? 'Vista inicial' : 'Marcar como inicial'}
                className={cn(
                  'inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center outline-none',
                  primary ? 'text-warning-text' : 'text-fg-faint hover:text-fg'
                )}
              >
                <StarIcon filled={primary} />
              </button>
              <button
                type="button"
                onClick={() => onSelect(v.id)}
                onDoubleClick={() => {
                  setRenamingId(v.id);
                  setRenameValue(v.name);
                }}
                className="min-w-0 flex-1 truncate text-left text-[11.5px] outline-none"
              >
                {v.name}
              </button>
              {views.length > 1 && (
                <button
                  type="button"
                  onClick={() => setConfirmDel(v)}
                  title="Eliminar vista"
                  className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-fg-faint opacity-0 outline-none hover:text-danger-text group-hover:opacity-100"
                >
                  <TrashIcon width={11} height={11} />
                </button>
              )}
            </div>
          );
        }}
      />

      {/* Confirmación con Alert del catálogo, NO window.confirm */}
      {confirmDel && (
        <Alert
          type="confirm"
          title="Eliminar vista"
          message={`¿Querés eliminar la vista "${confirmDel.name}"? Esta acción no se puede deshacer.`}
          confirmText="ELIMINAR"
          cancelText="CANCELAR"
          onConfirm={async () => {
            const id = confirmDel.id;
            setConfirmDel(null);
            await onRemove(id);
          }}
          onCancel={() => setConfirmDel(null)}
          onClose={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}
