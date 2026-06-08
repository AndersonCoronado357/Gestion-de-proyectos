// Panel lateral izquierdo del editor: lista de vistas (pantallas) del
// proyecto. Marca la vista activa, permite renombrar inline, eliminar y
// marcar una como "inicial" (la que se abre al entrar al módulo).

import { useState } from 'react';
import { cn } from '../../../../shared/lib/cn.js';
import Button from '../../../../shared/components/Button/index.js';
import Input from '../../../../shared/components/Input/index.js';
import {
  CheckIcon,
  PlusIcon,
  StarIcon,
  TrashIcon,
  XIcon
} from '../../../../shared/icons/index.js';
import type { DesignView } from '../../api.js';

interface Props {
  views: DesignView[];
  activeViewId: number | null;
  primaryViewId: number | null;
  onSelect: (id: number) => void;
  onAdd: () => Promise<void>;
  onRename: (id: number, name: string) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
  onSetPrimary: (id: number) => Promise<void>;
}

// Wrapper local que delega en StarIcon de la BD.
function StarMark({ filled }: { filled: boolean }) {
  return (
    <StarIcon
      width={12}
      height={12}
      className={filled ? '[&_svg_path]:fill-current' : undefined}
    />
  );
}

export default function ViewsSidebar({
  views,
  activeViewId,
  primaryViewId,
  onSelect,
  onAdd,
  onRename,
  onRemove,
  onSetPrimary
}: Props) {
  const [renameId, setRenameId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const commitRename = async (): Promise<void> => {
    if (renameId == null) return;
    const v = renameValue.trim();
    if (v) await onRename(renameId, v);
    setRenameId(null);
  };

  return (
    <aside className="flex h-full w-56 shrink-0 flex-col border-r border-border-subtle bg-bg">
      <div className="flex shrink-0 items-center justify-between px-3 pt-3 pb-1">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
          Vistas
        </p>
        <button
          type="button"
          onClick={() => void onAdd()}
          title="Nueva vista"
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-fg-muted outline-none transition-colors hover:bg-bg-muted hover:text-fg"
        >
          <PlusIcon width={13} height={13} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        <ul className="flex flex-col gap-0.5">
          {views.map((v) => {
            const active = v.id === activeViewId;
            const primary = v.id === primaryViewId;
            const renaming = v.id === renameId;
            return (
              <li key={v.id}>
                {renaming ? (
                  <div className="flex items-center gap-1 px-1.5 py-1">
                    <Input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void commitRename();
                        if (e.key === 'Escape') setRenameId(null);
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => void commitRename()}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-fg-muted outline-none hover:bg-bg-muted hover:text-fg"
                    >
                      <CheckIcon width={12} height={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setRenameId(null)}
                      className="inline-flex h-6 w-6 items-center justify-center rounded-md text-fg-muted outline-none hover:bg-bg-muted hover:text-fg"
                    >
                      <XIcon width={12} height={12} />
                    </button>
                  </div>
                ) : (
                  <div
                    className={cn(
                      'group flex items-center gap-1 rounded-md px-2 py-1.5 transition-colors',
                      active
                        ? 'bg-primary-100 dark:bg-primary-700/35'
                        : 'hover:bg-bg-muted'
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(v.id)}
                      className="flex min-w-0 flex-1 items-center gap-1.5 text-left outline-none"
                    >
                      <span
                        className={cn(
                          'shrink-0',
                          primary ? 'text-warning-text' : 'text-fg-faint'
                        )}
                        title={primary ? 'Vista inicial' : ''}
                      >
                        <StarMark filled={primary} />
                      </span>
                      <span
                        className={cn(
                          'truncate text-[12.5px]',
                          active ? 'font-semibold text-fg' : 'text-fg-muted'
                        )}
                      >
                        {v.name}
                      </span>
                    </button>
                    <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      {!primary && (
                        <button
                          type="button"
                          onClick={() => void onSetPrimary(v.id)}
                          title="Marcar como vista inicial"
                          className="inline-flex h-5 w-5 items-center justify-center rounded-md text-fg-faint outline-none hover:bg-bg hover:text-fg"
                        >
                          <StarMark filled={false} />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setRenameId(v.id);
                          setRenameValue(v.name);
                        }}
                        title="Renombrar"
                        className="inline-flex h-5 px-1 items-center justify-center rounded-md text-[10px] text-fg-faint outline-none hover:bg-bg hover:text-fg"
                      >
                        Renombrar
                      </button>
                      {views.length > 1 && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (window.confirm(`¿Eliminar la vista "${v.name}"?`)) {
                              await onRemove(v.id);
                            }
                          }}
                          title="Eliminar vista"
                          className="inline-flex h-5 w-5 items-center justify-center rounded-md text-fg-faint outline-none hover:bg-danger-surface hover:text-danger-text"
                        >
                          <TrashIcon width={11} height={11} />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-3 px-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => void onAdd()}
            leftIcon={<PlusIcon width={12} height={12} />}
            fullWidth
          >
            Nueva vista
          </Button>
        </div>
      </div>
    </aside>
  );
}
