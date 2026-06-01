import type { ReactNode } from 'react';
import {
  DndContext,
  closestCenter,
  type DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { GripIcon } from '../../icons/index.js';
import { useSortableItem, useSortableSensors } from './sortable.js';

interface SortableRowProps {
  id: string;
  children: ReactNode;
}

function SortableRow({ id, children }: SortableRowProps) {
  const { setNodeRef, attributes, listeners, style } = useSortableItem({ id });
  return (
    <li
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="group relative flex items-center gap-2 rounded-md bg-bg-muted px-3 py-2 transition-colors"
    >
      <span
        aria-hidden="true"
        className="cursor-grab text-fg-faint group-hover:text-fg-muted active:cursor-grabbing"
      >
        <GripIcon width={12} height={12} />
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
}

export interface DragDropListProps<T = { id: string }> {
  items: T[];
  getKey?: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  onReorder?: (next: T[]) => void;
}

/**
 * Lista vertical reordenable. Soporta mouse + touch + keyboard.
 */
export default function DragDropList<T>({
  items,
  getKey = (it) => (it as { id: string }).id,
  renderItem,
  onReorder
}: DragDropListProps<T>) {
  const sensors = useSortableSensors();
  const ids = items.map(getKey);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIdx = ids.indexOf(active.id as string);
    const toIdx = ids.indexOf(over.id as string);
    if (fromIdx < 0 || toIdx < 0) return;
    onReorder?.(arrayMove(items, fromIdx, toIdx));
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="flex flex-col gap-1">
          {items.map((it) => {
            const key = getKey(it);
            return (
              <SortableRow key={key} id={key}>
                {renderItem(it)}
              </SortableRow>
            );
          })}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
