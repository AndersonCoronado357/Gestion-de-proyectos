import { useEffect, useRef, useState } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { cn } from '../../../../shared/lib/cn.js';
import {
  ChevronRightIcon,
  TrashIcon,
  GripIcon
} from '../../../../shared/components/icons/index.jsx';
import { useSortableItem } from '../../../../shared/components/DragDropList/index.js';
import IconPasteButton from './IconPasteButton.jsx';

function SubmoduleRow({ sub, parentId, readOnly, onRemove, onIconChange }) {
  const { setNodeRef, attributes, listeners, style, isOver, active } =
    useSortableItem({
      id: sub.id,
      data: { type: 'submodule', subId: sub.id, parentId, label: sub.name },
      useDragOverlay: true
    });

  const childListeners = Object.fromEntries(
    Object.entries(listeners ?? {}).map(([key, handler]) => [
      key,
      (e) => {
        e.stopPropagation();
        handler?.(e);
      }
    ])
  );

  const folderHover = isOver && active?.data?.current?.type === 'folder';

  return (
    <li
      ref={readOnly ? undefined : setNodeRef}
      style={readOnly ? undefined : style}
      {...(readOnly ? {} : attributes)}
      {...(readOnly ? {} : childListeners)}
      className={cn(
        'group relative transition-colors',
        folderHover && 'bg-primary-50'
      )}
    >
      <div
        className={cn(
          'flex h-9 w-full items-center gap-2.5 pl-9 pr-3 text-[12.5px] outline-none transition-colors',
          'font-medium text-fg-muted hover:bg-primary-50 hover:text-primary'
        )}
      >
        {!readOnly && (
          <span
            aria-hidden="true"
            className="absolute left-3 top-1/2 -translate-y-1/2 cursor-grab text-fg-faint opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          >
            <GripIcon width={11} height={11} />
          </span>
        )}

        <IconPasteButton
          size={14}
          iconSvg={sub.iconSvg}
          onChange={readOnly ? undefined : onIconChange}
          className={cn(
            sub.iconSvg ? 'text-fg-faint group-hover:text-primary' : ''
          )}
        />
        <span className="flex-1 truncate text-left">{sub.name}</span>

        {!readOnly && (
          <button
            type="button"
            onClick={onRemove}
            title="Quitar"
            className="rounded-md p-1 text-fg-faint outline-none opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-500/15 dark:hover:text-red-400"
          >
            <TrashIcon width={12} height={12} />
          </button>
        )}
      </div>
    </li>
  );
}

export default function EditableModuleRow({
  module,
  forceOpen = false,
  readOnly = false,
  onRemove,
  onRename,
  onIconChange,
  onRemoveSubmodule,
  onSubmoduleIconChange
}) {
  // Módulos siempre arrancan CERRADOS, igual al sidebar real.
  // Auto-open cuando:
  //   - entra un submódulo nuevo por drag (count crece).
  //   - el padre nos pasa `forceOpen` (búsqueda activa que matcheó
  //     algún hijo — el usuario tiene que poder ver el resultado).
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(module.name);
  const hasChildren = module.submodules.length > 0;

  const prevSubCount = useRef(module.submodules.length);
  useEffect(() => {
    const count = module.submodules.length;
    if (count > prevSubCount.current) setOpen(true);
    prevSubCount.current = count;
  }, [module.submodules.length]);

  const { setNodeRef, attributes, listeners, style, isOver, active } =
    useSortableItem({
      id: module.id,
      data: { type: 'module', moduleId: module.id, label: module.name },
      disabled: editing || readOnly,
      useDragOverlay: true
    });

  const folderHover = isOver && active?.data?.current?.type === 'folder';

  const commit = () => {
    if (draft.trim() && draft !== module.name) onRename(draft.trim());
    setEditing(false);
  };

  const submoduleIds = module.submodules.map((s) => s.id);
  const showSubmodules = hasChildren && (open || forceOpen);

  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(editing || readOnly ? {} : listeners)}
      className={cn(
        'relative transition-colors',
        folderHover && 'bg-primary-50'
      )}
    >
      <div
        onClick={() => {
          if (hasChildren) setOpen((v) => !v);
        }}
        className={cn(
          'group relative flex h-10 w-full items-center gap-3 px-4 outline-none transition-colors duration-150',
          hasChildren && 'cursor-pointer',
          'font-medium text-fg-muted hover:bg-primary-50 hover:text-primary'
        )}
      >
        {!readOnly && (
          <span
            aria-hidden="true"
            className="absolute left-1 top-1/2 -translate-y-1/2 cursor-grab text-fg-faint opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          >
            <GripIcon width={12} height={12} />
          </span>
        )}

        <IconPasteButton
          size={17}
          iconSvg={module.iconSvg}
          onChange={readOnly ? undefined : onIconChange}
          className={cn(
            module.iconSvg ? 'text-fg-subtle group-hover:text-primary' : ''
          )}
        />

        {editing && !readOnly ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') {
                setDraft(module.name);
                setEditing(false);
              }
            }}
            className="flex-1 bg-transparent text-[13.5px] tracking-tight text-fg outline-none"
          />
        ) : (
          <div className="min-w-0 flex-1 truncate text-left">
            <span
              onDoubleClick={
                readOnly
                  ? undefined
                  : (e) => {
                      e.stopPropagation();
                      setEditing(true);
                    }
              }
              className="text-[13.5px] tracking-tight"
              title={readOnly ? undefined : 'Doble-click para renombrar'}
            >
              {module.name}
            </span>
          </div>
        )}

        {!readOnly && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            onPointerDown={(e) => e.stopPropagation()}
            title="Eliminar módulo"
            className="rounded-md p-1 text-fg-faint outline-none opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-500/15 dark:hover:text-red-400"
          >
            <TrashIcon width={12} height={12} />
          </button>
        )}

        {hasChildren && (
          <ChevronRightIcon
            width={13}
            height={13}
            className={cn(
              'shrink-0 text-fg-faint transition-transform duration-200',
              showSubmodules && 'rotate-90'
            )}
          />
        )}
      </div>

      {/* Submódulos: sólo se montan al DOM cuando el módulo está abierto.
          Era el bug central del drag: con `grid-rows: 0fr` los subs
          seguían teniendo `boundingClientRect` no-cero (CSS clip ≠
          geometría), así dnd-kit los detectaba con pointerWithin y el
          drop terminaba en un submódulo cubierto en vez del módulo bajo
          el cursor.  Sin montaje = sin rect = sin interferencia.
          Cuando dropeás sobre un módulo cerrado, el useEffect de arriba
          lo abre y montás los submódulos — incluido el recién dropeado,
          que ves aterrizar adentro. */}
      {showSubmodules && (
        <SortableContext
          items={submoduleIds}
          strategy={verticalListSortingStrategy}
        >
          <ul>
            {module.submodules.map((sub) => (
              <SubmoduleRow
                key={sub.id}
                sub={sub}
                parentId={module.id}
                readOnly={readOnly}
                onRemove={() => onRemoveSubmodule(sub.id)}
                onIconChange={(svg) => onSubmoduleIconChange(sub.id, svg)}
              />
            ))}
          </ul>
        </SortableContext>
      )}
    </li>
  );
}
