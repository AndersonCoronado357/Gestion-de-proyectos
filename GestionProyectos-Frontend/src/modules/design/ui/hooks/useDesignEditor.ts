// Estado del editor visual MULTI-FRAME.
//
// A diferencia del modelo viejo (una vista activa), todas las vistas
// (frames) viven en el mismo lienzo y son visibles al mismo tiempo.
// `activeFrameId` es sólo el frame "con foco" para mostrar las props del
// bloque seleccionado a la derecha.
//
// Cada vista mantiene UN solo layout (desktop) en BD. El mobile vive
// SÓLO en la vista previa (escala el mismo layout dentro del marco).

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  createView as apiCreateView,
  deleteView as apiDeleteView,
  getProject,
  renameProject as apiRenameProject,
  setPrimaryView as apiSetPrimaryView,
  updateView as apiUpdateView,
  type DesignProject,
  type DesignProjectWithViews,
  type DesignView
} from '../../api.js';
import {
  DEFAULT_FRAME_SIZE,
  emptyLayout,
  parseLayout,
  serializeLayout,
  type Block,
  type BlockProps,
  type FrameRect,
  type LayoutContent
} from '../../types.js';

const AUTOSAVE_DELAY = 600;

type LayoutsByView = Record<number, LayoutContent>;

export interface EditorState {
  loading: boolean;
  error: string | null;
  project: DesignProject | null;
  views: DesignView[];
  layouts: LayoutsByView;
  activeFrameId: number | null;
  selectedBlockId: string | null;
  saving: boolean;
  savedAt: number | null;
}

export interface EditorActions {
  setActiveFrame: (frameId: number) => void;
  selectBlock: (frameId: number, id: string | null) => void;
  addBlock: (frameId: number, block: Block) => void;
  updateBlock: (frameId: number, id: string, patch: Partial<Block>) => void;
  updateBlockProps: (frameId: number, id: string, props: BlockProps) => void;
  changeBlockId: (frameId: number, oldId: string, newId: string) => void;
  deleteBlock: (frameId: number, id: string) => void;
  /** Reordena el bloque en el array (mayor índice = renderizado encima). */
  reorderBlock: (frameId: number, id: string, action: 'front' | 'back' | 'forward' | 'backward') => void;
  moveFrame: (frameId: number, x: number, y: number) => void;
  resizeFrame: (frameId: number, w: number, h: number) => void;
  setFrameScroll: (frameId: number, scroll: boolean) => void;
  addView: () => Promise<DesignView | null>;
  renameView: (id: number, name: string) => Promise<void>;
  removeView: (id: number) => Promise<void>;
  reorderViews: (nextOrder: DesignView[]) => Promise<void>;
  renameProject: (name: string) => Promise<void>;
  setPrimaryView: (id: number | null) => Promise<void>;
}

export interface EditorDerived {
  selectedBlock: Block | null;
}

export type DesignEditor = EditorState & EditorActions & EditorDerived;

function nextFrameOffsetX(views: DesignView[], layouts: LayoutsByView): number {
  let maxRight = 0;
  for (const v of views) {
    const f = layouts[v.id]?.frame;
    if (f) maxRight = Math.max(maxRight, f.x + f.w);
  }
  return maxRight > 0 ? maxRight + 80 : 0;
}

function defaultFrameForIndex(index: number): FrameRect {
  return {
    x: index * (DEFAULT_FRAME_SIZE.width + 80),
    y: 0,
    w: DEFAULT_FRAME_SIZE.width,
    h: DEFAULT_FRAME_SIZE.height
  };
}

export function useDesignEditor(projectId: number | null): DesignEditor {
  const [project, setProject] = useState<DesignProject | null>(null);
  const [views, setViews] = useState<DesignView[]>([]);
  const [layouts, setLayouts] = useState<LayoutsByView>({});
  const [activeFrameId, setActiveFrameId] = useState<number | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const dirtyRef = useRef<Set<number>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Carga inicial ────────────────────────────────────────────────
  useEffect(() => {
    if (projectId == null) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      try {
        const p = await getProject(projectId);
        if (!p || cancelled) {
          if (!cancelled) setError('Proyecto no encontrado');
          return;
        }
        setProject(p);
        setViews(p.views);
        const map: LayoutsByView = {};
        p.views.forEach((v, i) => {
          const parsed = parseLayout(v.contentDesktop);
          if (!parsed.frame) parsed.frame = defaultFrameForIndex(i);
          map[v.id] = parsed;
        });
        setLayouts(map);
        setActiveFrameId(p.primaryViewId ?? p.views[0]?.id ?? null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Error cargando el proyecto');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // ── Autoguardado debounced (por frame) ────────────────────────────
  const flushDirty = useCallback(async () => {
    if (!project) return;
    const pending = Array.from(dirtyRef.current);
    if (pending.length === 0) return;
    dirtyRef.current.clear();
    setSaving(true);
    try {
      for (const viewId of pending) {
        const content = layouts[viewId];
        if (!content) continue;
        await apiUpdateView(project.id, viewId, {
          contentDesktop: serializeLayout(content)
        });
      }
      setSavedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error guardando');
    } finally {
      setSaving(false);
    }
  }, [project, layouts]);

  const scheduleSave = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void flushDirty();
    }, AUTOSAVE_DELAY);
  }, [flushDirty]);

  const markDirty = useCallback(
    (viewId: number) => {
      dirtyRef.current.add(viewId);
      scheduleSave();
    },
    [scheduleSave]
  );

  // ── Helpers ───────────────────────────────────────────────────────
  const mutateFrame = useCallback(
    (frameId: number, mutate: (l: LayoutContent) => LayoutContent) => {
      setLayouts((prev) => {
        const cur = prev[frameId] ?? emptyLayout();
        return { ...prev, [frameId]: mutate(cur) };
      });
      markDirty(frameId);
    },
    [markDirty]
  );

  // ── Acciones bloques ─────────────────────────────────────────────
  const addBlock = useCallback(
    (frameId: number, block: Block) => {
      mutateFrame(frameId, (l) => ({ ...l, blocks: [...l.blocks, block] }));
      setActiveFrameId(frameId);
      setSelectedBlockId(block.id);
    },
    [mutateFrame]
  );

  const updateBlock = useCallback(
    (frameId: number, id: string, patch: Partial<Block>) => {
      mutateFrame(frameId, (l) => ({
        ...l,
        blocks: l.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b))
      }));
    },
    [mutateFrame]
  );

  const updateBlockProps = useCallback(
    (frameId: number, id: string, props: BlockProps) => {
      mutateFrame(frameId, (l) => ({
        ...l,
        blocks: l.blocks.map((b) => (b.id === id ? { ...b, props } : b))
      }));
    },
    [mutateFrame]
  );

  const changeBlockId = useCallback(
    (frameId: number, oldId: string, newId: string) => {
      if (!newId || oldId === newId) return;
      mutateFrame(frameId, (l) => {
        if (l.blocks.some((b) => b.id === newId)) return l;
        return {
          ...l,
          blocks: l.blocks.map((b) => (b.id === oldId ? { ...b, id: newId } : b))
        };
      });
      setSelectedBlockId((cur) => (cur === oldId ? newId : cur));
    },
    [mutateFrame]
  );

  const deleteBlock = useCallback(
    (frameId: number, id: string) => {
      mutateFrame(frameId, (l) => ({ ...l, blocks: l.blocks.filter((b) => b.id !== id) }));
      setSelectedBlockId((cur) => (cur === id ? null : cur));
    },
    [mutateFrame]
  );

  const reorderBlock = useCallback(
    (frameId: number, id: string, action: 'front' | 'back' | 'forward' | 'backward') => {
      mutateFrame(frameId, (l) => {
        const idx = l.blocks.findIndex((b) => b.id === id);
        if (idx === -1) return l;
        const next = l.blocks.slice();
        const [item] = next.splice(idx, 1);
        if (action === 'front') next.push(item);
        else if (action === 'back') next.unshift(item);
        else if (action === 'forward') next.splice(Math.min(idx + 1, next.length), 0, item);
        else if (action === 'backward') next.splice(Math.max(idx - 1, 0), 0, item);
        return { ...l, blocks: next };
      });
    },
    [mutateFrame]
  );

  // ── Acciones frames ──────────────────────────────────────────────
  const moveFrame = useCallback(
    (frameId: number, x: number, y: number) => {
      mutateFrame(frameId, (l) => ({
        ...l,
        frame: { x, y, w: l.frame?.w ?? DEFAULT_FRAME_SIZE.width, h: l.frame?.h ?? DEFAULT_FRAME_SIZE.height }
      }));
    },
    [mutateFrame]
  );

  const resizeFrame = useCallback(
    (frameId: number, w: number, h: number) => {
      mutateFrame(frameId, (l) => ({
        ...l,
        frame: {
          x: l.frame?.x ?? 0,
          y: l.frame?.y ?? 0,
          w,
          h,
          scroll: l.frame?.scroll
        }
      }));
    },
    [mutateFrame]
  );

  const setFrameScroll = useCallback(
    (frameId: number, scroll: boolean) => {
      mutateFrame(frameId, (l) => ({
        ...l,
        frame: {
          x: l.frame?.x ?? 0,
          y: l.frame?.y ?? 0,
          w: l.frame?.w ?? DEFAULT_FRAME_SIZE.width,
          h: l.frame?.h ?? DEFAULT_FRAME_SIZE.height,
          scroll
        }
      }));
    },
    [mutateFrame]
  );

  // ── Vistas ───────────────────────────────────────────────────────
  const addView = useCallback(async (): Promise<DesignView | null> => {
    if (!project) return null;
    const created = await apiCreateView(project.id);
    if (created) {
      setViews((vs) => {
        const next = [...vs, created];
        // Posicionar frame al lado de los existentes.
        const x = nextFrameOffsetX(vs, layouts);
        setLayouts((m) => ({
          ...m,
          [created.id]: {
            blocks: [],
            frame: { x, y: 0, w: DEFAULT_FRAME_SIZE.width, h: DEFAULT_FRAME_SIZE.height }
          }
        }));
        // Persistir esa posición inicial.
        dirtyRef.current.add(created.id);
        scheduleSave();
        return next;
      });
      setActiveFrameId(created.id);
      setSelectedBlockId(null);
    }
    return created;
  }, [project, layouts, scheduleSave]);

  const renameView = useCallback(
    async (id: number, name: string) => {
      if (!project) return;
      const updated = await apiUpdateView(project.id, id, { name });
      if (updated) {
        setViews((vs) => vs.map((v) => (v.id === id ? { ...v, name: updated.name } : v)));
      }
    },
    [project]
  );

  const removeView = useCallback(
    async (id: number) => {
      if (!project) return;
      await apiDeleteView(project.id, id);
      setViews((vs) => vs.filter((v) => v.id !== id));
      setLayouts((m) => {
        const next = { ...m };
        delete next[id];
        return next;
      });
      setActiveFrameId((cur) => (cur === id ? null : cur));
      setSelectedBlockId(null);
    },
    [project]
  );

  const reorderViews = useCallback(
    async (nextOrder: DesignView[]) => {
      if (!project) return;
      // Estado local primero (UI feedback inmediato).
      setViews(nextOrder.map((v, i) => ({ ...v, position: i })));
      // Persistir cambios de position en BD.
      for (let i = 0; i < nextOrder.length; i++) {
        const v = nextOrder[i];
        if (v.position !== i) {
          try {
            await apiUpdateView(project.id, v.id, { position: i });
          } catch {
            // Continuamos; un re-fetch eventual corrige.
          }
        }
      }
    },
    [project]
  );

  const renameProject = useCallback(
    async (name: string) => {
      if (!project) return;
      const updated = await apiRenameProject(project.id, name);
      if (updated) setProject(updated);
    },
    [project]
  );

  const setPrimaryView = useCallback(
    async (id: number | null) => {
      if (!project) return;
      const updated = await apiSetPrimaryView(project.id, id);
      if (updated) setProject(updated);
    },
    [project]
  );

  // Flush al desmontar.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      void flushDirty();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedBlock: Block | null =
    (activeFrameId != null &&
      selectedBlockId != null &&
      layouts[activeFrameId]?.blocks.find((b) => b.id === selectedBlockId)) ||
    null;

  return {
    loading,
    error,
    project,
    views,
    layouts,
    activeFrameId,
    selectedBlockId,
    saving,
    savedAt,
    selectedBlock,
    setActiveFrame: (frameId) => {
      setActiveFrameId(frameId);
      setSelectedBlockId(null);
    },
    selectBlock: (frameId, id) => {
      if (id) {
        setActiveFrameId(frameId);
        setSelectedBlockId(id);
      } else {
        // (0, null) o (frame, null) = click vacío → cerrar panel derecho
        setActiveFrameId(null);
        setSelectedBlockId(null);
      }
    },
    addBlock,
    updateBlock,
    updateBlockProps,
    changeBlockId,
    deleteBlock,
    reorderBlock,
    moveFrame,
    resizeFrame,
    setFrameScroll,
    addView,
    renameView,
    removeView,
    reorderViews,
    renameProject,
    setPrimaryView
  };
}
