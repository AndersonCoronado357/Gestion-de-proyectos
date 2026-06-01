import {
  createContext,
  useContext,
  type ReactNode
} from 'react';
import {
  DndContext,
  closestCorners,
  useDroppable,
  type DragEndEvent,
  type DragOverEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { cn } from '../../lib/cn.js';
import { GripIcon } from '../../icons/index.js';
import { useSortableItem, useSortableSensors } from './sortable.js';

export interface ZoneMovePayload {
  fromZone: string;
  toZone: string;
  key: string;
  overKey: string | null;
}

interface ZoneItemData {
  type: 'zone-item';
  fromZone: string;
  key: string;
}

interface ZoneData {
  type: 'zone';
  zoneId: string;
}

type ZoneActiveData = ZoneItemData | ZoneData;

const ZonesContext = createContext<object | null>(null);

function resolveOver(
  over: { data?: { current?: unknown } } | null
): { overZone: string; overKey: string | null } | null {
  const o = over?.data?.current as ZoneActiveData | undefined;
  if (o?.type === 'zone-item') return { overZone: o.fromZone, overKey: o.key };
  if (o?.type === 'zone') return { overZone: o.zoneId, overKey: null };
  return null;
}

export interface DragDropZoneContainerProps {
  children: ReactNode;
  onMove?: (payload: ZoneMovePayload) => void;
}

export function DragDropZoneContainer({
  children,
  onMove
}: DragDropZoneContainerProps) {
  const sensors = useSortableSensors();

  // Durante el arrastre sólo movemos ENTRE zonas distintas (para que el item
  // aparezca en la zona destino). El reorden dentro de la misma columna lo
  // anima la estrategia de @dnd-kit y se confirma al soltar (onDragEnd); el
  // commit anima gracias a animateLayoutChanges (ver sortable.ts).
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const a = active.data?.current as ZoneActiveData | undefined;
    if (!a || a.type !== 'zone-item') return;
    const res = resolveOver(over);
    if (!res) return;
    if (res.overZone !== a.fromZone && res.overKey !== a.key) {
      onMove?.({
        fromZone: a.fromZone,
        toZone: res.overZone,
        key: a.key,
        overKey: res.overKey
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const a = active.data?.current as ZoneActiveData | undefined;
    if (!a || a.type !== 'zone-item') return;
    const res = resolveOver(over);
    if (!res) return;
    if (res.overZone === a.fromZone && res.overKey && res.overKey !== a.key) {
      onMove?.({
        fromZone: a.fromZone,
        toZone: res.overZone,
        key: a.key,
        overKey: res.overKey
      });
    }
  };

  return (
    <ZonesContext.Provider value={{}}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        {children}
      </DndContext>
    </ZonesContext.Provider>
  );
}

interface DraggableItemProps<T> {
  zoneId: string;
  item: T;
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
}

function DraggableItem<T>({
  zoneId,
  item,
  getKey,
  renderItem
}: DraggableItemProps<T>) {
  const key = getKey(item);

  const { setNodeRef, attributes, listeners, style } = useSortableItem({
    id: key,
    data: { type: 'zone-item', fromZone: zoneId, key }
  });

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
      <div className="min-w-0 flex-1">{renderItem(item)}</div>
    </li>
  );
}

export interface DragDropZoneProps<T = { id: string }> {
  zoneId: string;
  items: T[];
  getKey?: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  title?: ReactNode;
  emptyText?: string;
  className?: string;
}

export default function DragDropZone<T>({
  zoneId,
  items,
  getKey = (it) => (it as { id: string }).id,
  renderItem,
  title,
  emptyText = 'Vacía',
  className
}: DragDropZoneProps<T>) {
  const ctx = useContext(ZonesContext);
  if (!ctx) {
    return (
      <DragDropZoneContainer>
        <ZoneBody
          zoneId={zoneId}
          items={items}
          getKey={getKey}
          renderItem={renderItem}
          title={title}
          emptyText={emptyText}
          className={className}
        />
      </DragDropZoneContainer>
    );
  }
  return (
    <ZoneBody
      zoneId={zoneId}
      items={items}
      getKey={getKey}
      renderItem={renderItem}
      title={title}
      emptyText={emptyText}
      className={className}
    />
  );
}

interface ZoneBodyProps<T> {
  zoneId: string;
  items: T[];
  getKey: (item: T) => string;
  renderItem: (item: T) => ReactNode;
  title?: ReactNode;
  emptyText: string;
  className?: string;
}

function ZoneBody<T>({
  zoneId,
  items,
  getKey,
  renderItem,
  title,
  emptyText,
  className
}: ZoneBodyProps<T>) {
  const { setNodeRef, isOver, active } = useDroppable({
    id: `zone-${zoneId}`,
    data: { type: 'zone', zoneId }
  });

  const itemIds = items.map((it) => getKey(it));
  const activeData = active?.data?.current as ZoneActiveData | undefined;
  const activeFromOtherZone =
    isOver &&
    activeData?.type === 'zone-item' &&
    activeData.fromZone !== zoneId;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex min-h-[120px] flex-col gap-1 rounded-lg bg-bg-muted/40 p-3 transition-colors',
        activeFromOtherZone && 'bg-primary-50',
        className
      )}
    >
      {title && (
        <p className="mb-1 text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
          {title}
        </p>
      )}
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        {items.length === 0 ? (
          <p className="my-4 text-center text-[11px] text-fg-faint">
            {emptyText}
          </p>
        ) : (
          <ul className="flex flex-col gap-1">
            {items.map((it) => (
              <DraggableItem
                key={getKey(it)}
                zoneId={zoneId}
                item={it}
                getKey={getKey}
                renderItem={renderItem}
              />
            ))}
          </ul>
        )}
      </SortableContext>
    </div>
  );
}
