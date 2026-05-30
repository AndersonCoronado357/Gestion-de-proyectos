import type { CSSProperties } from 'react';
import {
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type SensorDescriptor,
  type SensorOptions
} from '@dnd-kit/core';
import {
  defaultAnimateLayoutChanges,
  sortableKeyboardCoordinates,
  useSortable,
  type AnimateLayoutChanges
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Fuerza la animación del cambio de layout al reordenar/soltar. El default de
// dnd-kit a veces NO anima el commit (se ve un "brinco" sin animación, típico
// al mover el primer item hacia arriba/abajo); con wasDragging:true el item se
// desliza animado a su nueva posición. No cambia diseño, sólo la transición.
const animateLayoutChanges: AnimateLayoutChanges = (args) =>
  defaultAnimateLayoutChanges({ ...args, wasDragging: true });

// Sensores compartidos por todos los DnD del proyecto.
// Pointer: arranca a 3px (clicks no se confunden con drags).
// Touch: long-press 150ms + 8px de tolerancia (no rompe scroll vertical).
// Keyboard: accesibilidad por flechas.
export function useSortableSensors(): SensorDescriptor<SensorOptions>[] {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 8 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );
}

export interface UseSortableItemOptions {
  id: string | number;
  data?: Record<string, unknown>;
  disabled?: boolean;
  useDragOverlay?: boolean;
}

// Hook compartido para cualquier row sortable.
//
//  - useDragOverlay: false (default) → el row se transforma en sitio,
//    con z-index alto durante el drag. Apto para listas en contenedores
//    sin clipping (overflow:visible).
//  - useDragOverlay: true → el row se oculta (opacity:0) durante el drag
//    y se espera que el consumidor renderice un fantasma en <DragOverlay>.
//    Necesario cuando hay overflow:hidden en algún ancestro que cortaría
//    el transform in-situ.
export function useSortableItem({
  id,
  data,
  disabled = false,
  useDragOverlay = false
}: UseSortableItemOptions) {
  const sortable = useSortable({ id, data, disabled, animateLayoutChanges });
  const { transform, transition, isDragging } = sortable;

  const style: CSSProperties = useDragOverlay
    ? {
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: disabled ? 'auto' : 'none',
        opacity: isDragging ? 0 : undefined
      }
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        touchAction: disabled ? 'auto' : 'none',
        position: isDragging ? 'relative' : undefined,
        zIndex: isDragging ? 50 : undefined
      };

  return { ...sortable, style };
}
