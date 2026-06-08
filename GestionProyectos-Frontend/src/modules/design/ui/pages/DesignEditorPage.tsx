// Editor fullscreen.

import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '../../../../shared/lib/cn.js';
import EditorTopBar from '../components/EditorTopBar.js';
import Canvas from '../components/Canvas.js';
import ComponentsPanel from '../components/ComponentsPanel.js';
import PropertiesPanel from '../components/PropertiesPanel.js';
import FramePropertiesPanel from '../components/FramePropertiesPanel.js';
import BottomToolbar, { type CursorMode } from '../components/BottomToolbar.js';
import {
  ChevronLeftIcon,
  ChevronRightIcon
} from '../../../../shared/icons/index.js';
import { useDesignEditor } from '../hooks/useDesignEditor.js';
import { instantiateBlock } from '../../lib/blockManifest.js';
import { FRAME_PADDING } from '../../types.js';
import { useToast } from '../../../../shared/components/Toast/index.js';

export default function DesignEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = id ? Number(id) : null;
  const e = useDesignEditor(projectId);
  const toast = useToast();
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [cursorMode, setCursorMode] = useState<CursorMode>('select');
  const [zoom, setZoom] = useState(1);

  // En pantallas mobile (< 768px) redirige directamente a la previa —
  // el editor tipo Figma no tiene sentido a ese tamaño.
  useEffect(() => {
    if (!projectId) return;
    const check = (): void => {
      if (window.innerWidth < 768) {
        navigate(`/administracion/diseno/${projectId}/preview`, { replace: true });
      }
    };
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, [projectId, navigate]);

  if (!projectId) {
    return (
      <div className="flex h-screen items-center justify-center text-fg-faint">
        Diseño no válido.
      </div>
    );
  }
  if (e.loading && !e.project) {
    // Loader silencioso del editor: barra superior + sidebar + canvas
    // todos en el color de fondo del editor con un spinner discreto
    // centrado. Nada de skeletons grises ruidosos.
    return (
      <div className="flex h-screen w-full flex-col bg-page">
        <div className="h-12 shrink-0 bg-bg" />
        <div className="flex min-h-0 flex-1">
          <div className="h-full w-[240px] shrink-0 border-r border-border-subtle bg-bg" />
          <div className="relative flex min-w-0 flex-1 items-center justify-center">
            <div className="flex items-center gap-2 text-[12px] text-fg-faint">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
              <span>Cargando diseño…</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (e.error || !e.project) {
    return (
      <div className="flex h-screen items-center justify-center text-danger-text">
        {e.error ?? 'No se pudo cargar el diseño'}
      </div>
    );
  }

  const addContainerToActiveFrame = (): void => {
    const fid = e.activeFrameId ?? e.views[0]?.id;
    if (fid == null) return;
    const block = instantiateBlock('container', FRAME_PADDING, FRAME_PADDING);
    if (block) e.addBlock(fid, block);
  };

  const hasBlock = !!(e.selectedBlock && e.activeFrameId != null);
  const hasFrame = !hasBlock && e.activeFrameId != null;
  const activeView = e.activeFrameId != null ? e.views.find((v) => v.id === e.activeFrameId) ?? null : null;
  const showRight = hasBlock || hasFrame;

  return (
    <div className="flex h-screen w-full flex-col bg-page">
      <EditorTopBar
        name={e.project.name}
        onRename={(n) => void e.renameProject(n)}
        saving={e.saving}
        savedAt={e.savedAt}
        projectId={e.project.id}
        onAddView={async () => {
          await e.addView();
        }}
        onBack={() => navigate(`/administracion/submodulos/${e.project!.id}`)}
      />

      <div className="flex min-h-0 flex-1">
        {/* ── IZQUIERDA ── */}
        <aside
          className={cn(
            'relative flex h-full shrink-0 flex-col border-r border-border-subtle bg-bg transition-[width] duration-150',
            leftCollapsed ? 'w-[34px]' : 'w-[240px]'
          )}
        >
          {/* Botón colapsar/expandir centrado VERTICALMENTE en el borde */}
          <button
            type="button"
            onClick={() => setLeftCollapsed((c) => !c)}
            title={leftCollapsed ? 'Expandir panel' : 'Colapsar panel'}
            className="absolute -right-3 top-1/2 z-10 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-bg text-fg-muted shadow-md ring-1 ring-border-subtle outline-none transition-colors hover:text-fg"
          >
            {leftCollapsed ? (
              <ChevronRightIcon width={11} height={11} />
            ) : (
              <ChevronLeftIcon width={11} height={11} />
            )}
          </button>

          {!leftCollapsed && (
            <div className="min-h-0 flex-1">
              <ComponentsPanel />
            </div>
          )}
        </aside>

        {/* ── CENTRO ── */}
        <main className="relative flex min-w-0 flex-1 flex-col">
          <Canvas
            views={e.views}
            layouts={e.layouts}
            primaryViewId={e.project.primaryViewId}
            activeFrameId={e.activeFrameId}
            selectedBlockId={e.selectedBlockId}
            cursorMode={cursorMode}
            zoom={zoom}
            onZoomChange={(z) => setZoom(z)}
            onSelectBlock={(frameId, blockId) => e.selectBlock(frameId, blockId)}
            onSelectFrame={(frameId) => e.setActiveFrame(frameId)}
            onAddBlock={(frameId, block) => e.addBlock(frameId, block)}
            onMoveBlock={(frameId, blockId, x, y) =>
              e.updateBlock(frameId, blockId, { x, y })
            }
            onResizeBlock={(frameId, blockId, x, y, w, h) =>
              e.updateBlock(frameId, blockId, { x, y, w, h })
            }
            onDeleteBlock={(frameId, blockId) => {
              e.deleteBlock(frameId, blockId);
              toast.success({ title: 'Eliminado', message: 'Componente eliminado' });
            }}
            onReorderBlock={(frameId, blockId, action) =>
              e.reorderBlock(frameId, blockId, action)
            }
            onMoveFrame={(frameId, x, y) => e.moveFrame(frameId, x, y)}
            onResizeFrame={(frameId, w, h) => e.resizeFrame(frameId, w, h)}
            onRenameFrame={(frameId, name) => void e.renameView(frameId, name)}
            onSetPrimary={(frameId) => void e.setPrimaryView(frameId)}
            onRemoveFrame={async (frameId) => {
              await e.removeView(frameId);
              toast.success({ title: 'Vista eliminada' });
            }}
          />

          <BottomToolbar
            cursorMode={cursorMode}
            onCursorMode={setCursorMode}
            zoom={zoom}
            onZoomIn={() => setZoom((z) => Math.min(3, z + 0.1))}
            onZoomOut={() => setZoom((z) => Math.max(0.2, z - 0.1))}
            onZoomReset={() => setZoom(1)}
            onAddView={async () => {
              await e.addView();
            }}
            onAddContainer={addContainerToActiveFrame}
            onPreview={() =>
              navigate(`/administracion/diseno/${e.project!.id}/preview`)
            }
          />
        </main>

        {/* ── DERECHA: bloque o frame ── */}
        {showRight && (
          <aside className="flex h-full w-[300px] shrink-0 flex-col bg-bg">
            {hasBlock ? (
              <PropertiesPanel
                block={e.selectedBlock!}
                views={e.views}
                onChangeProps={(p) =>
                  e.updateBlockProps(e.activeFrameId!, e.selectedBlock!.id, p)
                }
                onDelete={() => {
                  e.deleteBlock(e.activeFrameId!, e.selectedBlock!.id);
                  toast.success({ title: 'Eliminado', message: 'Componente eliminado' });
                }}
              />
            ) : activeView ? (
              <FramePropertiesPanel
                view={activeView}
                canDelete={e.views.length > 1}
                onRename={(name) => void e.renameView(activeView.id, name)}
                onDelete={async () => {
                  await e.removeView(activeView.id);
                  toast.success({ title: 'Vista eliminada' });
                }}
              />
            ) : null}
          </aside>
        )}
      </div>
    </div>
  );
}
