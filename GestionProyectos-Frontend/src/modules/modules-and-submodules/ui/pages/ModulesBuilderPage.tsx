import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent
} from '@dnd-kit/core';
import { cn } from '../../../../shared/lib/cn.js';
import { useDetectedModules } from '../hooks/useDetectedModules.js';
import { useBuilder } from '../hooks/useBuilder.js';
import { useCan } from '../../../auth/ui/useCan.js';
import DetectedModulesPalette from '../components/DetectedModulesPalette.js';
import SidebarBuilder from '../components/SidebarBuilder.js';
import Button from '../../../../shared/components/Button/index.js';
import {
  FolderIcon,
  GripIcon,
  PlusIcon
} from '../../../../shared/icons/index.js';
import { useSortableSensors } from '../../../../shared/components/DragDropList/index.js';

type DragActiveItem =
  | { type: 'folder'; folderId: string; label: string }
  | { type: 'module'; moduleId: string; label: string }
  | { type: 'submodule'; subId: string; parentId: string; label: string };

interface CardProps {
  children: ReactNode;
  className?: string;
}

function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        'flex flex-col overflow-hidden rounded-xl bg-bg shadow-sm',
        className
      )}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  title: ReactNode;
  subtitle: ReactNode;
  trailing?: ReactNode;
}

function CardHeader({ title, subtitle, trailing }: CardHeaderProps) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-3 px-4 pt-4">
      <div className="min-w-0">
        <h3 className="text-[12.5px] font-semibold text-fg">{title}</h3>
        <p className="mt-0.5 text-[11px] text-fg-faint">{subtitle}</p>
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}

// Indicador discreto del estado de auto-save.  Reemplaza el botón
// "Guardar" — todo se persiste en background y los demás clientes ven
// los cambios en vivo vía SSE.
function AutosaveStatus({
  status,
  error
}: {
  status: 'idle' | 'saving' | 'saved' | 'error';
  error: string | null;
}) {
  if (status === 'error') {
    return (
      <span
        title={error ?? undefined}
        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-danger-text"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-danger" />
        Error al guardar
      </span>
    );
  }
  if (status === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-fg-muted">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-fg-muted" />
        Guardando…
      </span>
    );
  }
  if (status === 'saved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-primary-700">
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        Guardado
      </span>
    );
  }
  return null;
}

interface GhostProps {
  label: string;
}

// Ghosts renderizados en <DragOverlay>. Necesarios porque toda la
// jerarquía (Card → aside → nav) tiene overflow:hidden y un transform
// in-situ se cortaría. El overlay se monta en document.body, sin clip.
function FolderDragGhost({ label }: GhostProps) {
  return (
    <div className="pointer-events-none flex items-center gap-2 rounded-md bg-bg-muted px-3 py-2 shadow-md">
      <FolderIcon width={14} height={14} className="text-primary-700" />
      <span className="text-[12px] font-medium text-fg">{label}</span>
    </div>
  );
}

function ModuleDragGhost({ label }: GhostProps) {
  return (
    <div className="pointer-events-none flex h-10 items-center gap-3 rounded-md bg-bg px-4 shadow-md ring-1 ring-border-subtle">
      <GripIcon width={12} height={12} className="text-fg-faint" />
      <span className="text-[13.5px] font-medium tracking-tight text-fg">
        {label}
      </span>
    </div>
  );
}

function SubmoduleDragGhost({ label }: GhostProps) {
  return (
    <div className="pointer-events-none flex h-9 items-center gap-2.5 rounded-md bg-bg px-3 shadow-md ring-1 ring-border-subtle">
      <GripIcon width={11} height={11} className="text-fg-faint" />
      <span className="text-[12.5px] font-medium text-fg-muted">{label}</span>
    </div>
  );
}

export default function ModulesBuilderPage() {
  const folders = useDetectedModules();
  const builder = useBuilder();
  const canEdit = useCan('edit');
  const navigate = useNavigate();
  const [activeItem, setActiveItem] = useState<DragActiveItem | null>(null);
  const sensors = useSortableSensors();

  const handleDragStart = (event: DragStartEvent) => {
    setActiveItem(
      (event.active?.data?.current as DragActiveItem | undefined) ?? null
    );
  };

  const handleDragCancel = () => setActiveItem(null);

  // Collision detection ESTRICTA: sólo cuenta lo que está exactamente
  // bajo el puntero.  Sin fallback a `rectIntersection`, que "snapeaba"
  // al módulo más cercano cuando el cursor caía en zona vacía y producía
  // inserciones accidentales (un folder se "agregaba" al módulo más
  // cercano aunque el usuario lo hubiera soltado al lado).
  //
  // Resultado: si el drop no aterriza sobre un módulo o submódulo
  // visible, `over` es null y handleDragEnd lo ignora — exactamente lo
  // que el usuario espera.
  const collisionDetection: CollisionDetection = (args) => pointerWithin(args);

  // Live cross-module move: cuando un submódulo de M1 pasa sobre M2 (o
  // sobre un submódulo de M2), lo trasladamos a M2 en el estado. Esto
  // hace que el SortableContext de M2 lo registre y la sortable strategy
  // empiece a hacer hueco visualmente. Sólo emite cuando cruza la frontera.
  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const a = active.data?.current as DragActiveItem | undefined;
    const o = over.data?.current as DragActiveItem | undefined;
    if (a?.type !== 'submodule') return;

    let targetModuleId: string;
    let overSubId: string | null;
    if (o?.type === 'submodule') {
      targetModuleId = o.parentId;
      overSubId = o.subId;
    } else if (o?.type === 'module') {
      targetModuleId = o.moduleId;
      overSubId = null;
    } else {
      return;
    }

    if (a.parentId !== targetModuleId) {
      builder.moveSubmoduleAcross(
        a.parentId,
        targetModuleId,
        String(active.id),
        overSubId
      );
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const a = active.data?.current as DragActiveItem | undefined;
    const o = over.data?.current as DragActiveItem | undefined;
    if (!a || !o) return;

    if (a.type === 'folder' && (o.type === 'module' || o.type === 'submodule')) {
      const moduleId = o.type === 'module' ? o.moduleId : o.parentId;
      builder.addSubmodule(moduleId, a.folderId, a.label);
      return;
    }

    if (a.type === 'module' && o.type === 'module' && active.id !== over.id) {
      const oldIdx = builder.modules.findIndex((m) => m.id === active.id);
      const newIdx = builder.modules.findIndex((m) => m.id === over.id);
      if (oldIdx >= 0 && newIdx >= 0) {
        const position = oldIdx < newIdx ? 'after' : 'before';
        builder.moveModule(String(active.id), String(over.id), position);
      }
      return;
    }

    if (
      a.type === 'submodule' &&
      o.type === 'submodule' &&
      active.id !== over.id
    ) {
      if (a.parentId === o.parentId) {
        const mod = builder.modules.find((m) => m.id === a.parentId);
        if (!mod) return;
        const oldIdx = mod.submodules.findIndex((s) => s.id === active.id);
        const newIdx = mod.submodules.findIndex((s) => s.id === over.id);
        if (oldIdx >= 0 && newIdx >= 0) {
          const position = oldIdx < newIdx ? 'after' : 'before';
          builder.moveSubmodule(
            a.parentId,
            String(active.id),
            String(over.id),
            position
          );
        }
      } else {
        builder.moveSubmoduleAcross(
          a.parentId,
          o.parentId,
          String(active.id),
          String(over.id)
        );
      }
      return;
    }

    if (
      a.type === 'submodule' &&
      o.type === 'module' &&
      a.parentId !== o.moduleId
    ) {
      builder.moveSubmoduleAcross(
        a.parentId,
        o.moduleId,
        String(active.id),
        null
      );
    }
  };

  // Sin permiso `edit` toda la página se vuelve read-only: bloqueamos
  // los handlers de drag y aplicamos pointer-events-none + opacity sobre
  // el contenido para que no se pueda renombrar, agregar ni borrar nada.
  const dndProps = canEdit
    ? {
        sensors,
        collisionDetection,
        onDragStart: handleDragStart,
        onDragOver: handleDragOver,
        onDragEnd: handleDragEnd,
        onDragCancel: handleDragCancel
      }
    : { sensors, collisionDetection };

  return (
    <DndContext {...dndProps}>
      <div className="flex h-full flex-col gap-4 overflow-hidden p-3 sm:p-4 md:flex-row lg:p-8">
        <Card className="h-[40%] shrink-0 md:h-auto md:w-[400px]">
          <CardHeader
            title="Submódulos detectados"
            subtitle={
              canEdit
                ? 'Arrástralos a un módulo (mantén pulsado en móvil)'
                : 'Sólo lectura'
            }
            trailing={
              canEdit ? (
                <Button
                  size="sm"
                  variant="primary"
                  leftIcon={<PlusIcon width={14} height={14} strokeWidth={2.75} />}
                  onClick={() => navigate('/administracion/modulos/crear-submodulo')}
                >
                  Crear submódulo
                </Button>
              ) : null
            }
          />
          <div className="min-h-0 flex-1 px-4 pb-4 pt-2">
            <DetectedModulesPalette
              folders={folders}
              folderUsage={builder.folderUsage}
              readOnly={!canEdit}
            />
          </div>
        </Card>

        <Card className="min-w-0 flex-1">
          <CardHeader
            title="Vista previa"
            subtitle={
              canEdit
                ? 'Edita directamente sobre la vista del sidebar — los cambios se guardan solos'
                : 'Sólo lectura'
            }
            trailing={
              canEdit ? (
                <AutosaveStatus
                  status={builder.saveStatus}
                  error={builder.saveError}
                />
              ) : null
            }
          />
          <div className="min-h-0 flex-1 pt-2">
            <SidebarBuilder builder={builder} readOnly={!canEdit} />
          </div>
        </Card>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem?.type === 'folder' && (
          <FolderDragGhost label={activeItem.label} />
        )}
        {activeItem?.type === 'module' && (
          <ModuleDragGhost label={activeItem.label} />
        )}
        {activeItem?.type === 'submodule' && (
          <SubmoduleDragGhost label={activeItem.label} />
        )}
      </DragOverlay>
    </DndContext>
  );
}
