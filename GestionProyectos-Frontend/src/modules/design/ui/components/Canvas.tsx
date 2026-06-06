// Lienzo infinito estilo Figma.
//   - Background = grid de puntos amplio sobre el bg blanco
//   - Frames múltiples (vistas) en el mismo lienzo, page-bg color
//   - Pan: cursor mano (toolbar) o middle-click. En select-mode, sólo
//     desde área vacía del viewport.
//   - Zoom: SOLO Ctrl/⌘ + rueda
//   - Drop respeta el padding del frame; resize clampea al padding
//   - Selección: 1px primary + 8 esferas en perímetro (NW/N/NE/E/SE/S/SW/W)
//   - Snap entre frames al moverlos (bordes y centros)
//   - Atajos: Delete elimina, Escape deselecciona

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
  type PointerEvent as ReactPointerEvent
} from 'react';
import { cn } from '../../../../shared/lib/cn.js';
import Alert from '../../../../shared/components/Alert/index.js';
import {
  getBlockDef,
  getPreset,
  instantiateBlock,
  instantiateFromPreset,
  type BlockDef
} from '../../lib/blockManifest.js';
import {
  DEFAULT_FRAME_SIZE,
  FRAME_PADDING,
  type Block,
  type FrameRect,
  type LayoutContent
} from '../../types.js';
import { DRAG_MIME } from './ComponentsPanel.js';
import type { DesignView } from '../../api.js';

const MIN_W = 30;
const MIN_H = 16;
// El mínimo del frame es el tamaño con el que se crea (no se puede achicar).
const MIN_FRAME_H = DEFAULT_FRAME_SIZE.height;
const MIN_FRAME_W = 320;
const MIN_ZOOM = 0.15;
const MAX_ZOOM = 3;
const SNAP_THRESHOLD = 6;
const FRAME_SNAP_THRESHOLD = 8;
const FRAME_LABEL_HEIGHT = 22;

type ResizeAxis = 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w' | 'nw';
type FrameResizeAxis = 'b'; // sólo alto del frame

interface FrameLayoutMap {
  [viewId: number]: LayoutContent;
}

export type CursorMode = 'select' | 'pan' | 'multi';

interface Props {
  views: DesignView[];
  layouts: FrameLayoutMap;
  primaryViewId: number | null;
  activeFrameId: number | null;
  selectedBlockId: string | null;
  cursorMode?: CursorMode;
  zoom: number;
  onZoomChange: (nextZoom: number, anchorClientX?: number, anchorClientY?: number) => void;
  onSelectBlock: (frameId: number, blockId: string | null) => void;
  onSelectFrame: (frameId: number) => void;
  onAddBlock: (frameId: number, block: Block) => void;
  onMoveBlock: (frameId: number, id: string, x: number, y: number) => void;
  onResizeBlock: (frameId: number, id: string, x: number, y: number, w: number, h: number) => void;
  onDeleteBlock: (frameId: number, id: string) => void;
  onReorderBlock?: (frameId: number, id: string, action: 'front' | 'back' | 'forward' | 'backward') => void;
  onMoveFrame: (frameId: number, x: number, y: number) => void;
  onResizeFrame: (frameId: number, w: number, h: number) => void;
  onRenameFrame: (frameId: number, name: string) => void;
  onSetPrimary: (frameId: number) => void;
  onRemoveFrame: (frameId: number) => void;
}

interface DragMoveBlock {
  kind: 'block-move';
  frameId: number;
  blockId: string;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
  startW: number;
  startH: number;
  /** Posiciones iniciales de OTROS bloques que se mueven en conjunto
   *  (multi-selección). Si vacío, solo se mueve este bloque. */
  groupStartPositions?: Map<string, { frameId: number; x: number; y: number; w: number; h: number }>;
}
interface DragResizeBlock {
  kind: 'block-resize';
  frameId: number;
  blockId: string;
  axis: ResizeAxis;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
  startW: number;
  startH: number;
}
interface DragMoveFrame {
  kind: 'frame-move';
  frameId: number;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
  startW: number;
  startH: number;
}
interface DragResizeFrame {
  kind: 'frame-resize';
  frameId: number;
  axis: FrameResizeAxis;
  startClientX: number;
  startClientY: number;
  startX: number;
  startY: number;
  startW: number;
  startH: number;
}
type DragState = DragMoveBlock | DragResizeBlock | DragMoveFrame | DragResizeFrame;

interface SnapLine {
  axis: 'v' | 'h';
  pos: number;
  from: number;
  to: number;
}

function defaultFrameRect(index: number): FrameRect {
  return {
    x: index * (DEFAULT_FRAME_SIZE.width + 120),
    y: 0,
    w: DEFAULT_FRAME_SIZE.width,
    h: DEFAULT_FRAME_SIZE.height
  };
}

function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg width={11} height={11} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round">
      <path d="M12 2 L14.91 8.41 22 9.27 16.73 14.14 18.18 21.02 12 17.27 5.82 21.02 7.27 14.14 2 9.27 9.09 8.41 Z" />
    </svg>
  );
}
function TrashSmall() {
  return (
    <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
    </svg>
  );
}

// Configuración de los 8 handles (posicion + cursor)
const HANDLES: Array<{ axis: ResizeAxis; style: React.CSSProperties; cursor: string }> = [
  { axis: 'nw', style: { top: -3, left: -3 }, cursor: 'cursor-nwse-resize' },
  { axis: 'n', style: { top: -3, left: '50%', transform: 'translateX(-50%)' }, cursor: 'cursor-ns-resize' },
  { axis: 'ne', style: { top: -3, right: -3 }, cursor: 'cursor-nesw-resize' },
  { axis: 'e', style: { top: '50%', right: -3, transform: 'translateY(-50%)' }, cursor: 'cursor-ew-resize' },
  { axis: 'se', style: { bottom: -3, right: -3 }, cursor: 'cursor-nwse-resize' },
  { axis: 's', style: { bottom: -3, left: '50%', transform: 'translateX(-50%)' }, cursor: 'cursor-ns-resize' },
  { axis: 'sw', style: { bottom: -3, left: -3 }, cursor: 'cursor-nesw-resize' },
  { axis: 'w', style: { top: '50%', left: -3, transform: 'translateY(-50%)' }, cursor: 'cursor-ew-resize' }
];

// Qué handles mostrar según política de resize.
function handlesFor(policy: 'both' | 'width' | 'height' | 'none'): ResizeAxis[] {
  if (policy === 'none') return [];
  if (policy === 'width') return ['e', 'w'];
  if (policy === 'height') return ['n', 's'];
  return ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];
}

export default function Canvas({
  views,
  layouts,
  primaryViewId,
  activeFrameId,
  selectedBlockId,
  cursorMode = 'select',
  zoom,
  onZoomChange,
  onSelectBlock,
  onSelectFrame,
  onAddBlock,
  onMoveBlock,
  onResizeBlock,
  onDeleteBlock,
  onReorderBlock,
  onMoveFrame,
  onResizeFrame,
  onRenameFrame,
  onSetPrimary,
  onRemoveFrame
}: Props) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [pan, setPan] = useState({ x: 120, y: 120 });
  const [panning, setPanning] = useState<{
    startClientX: number;
    startClientY: number;
    startPanX: number;
    startPanY: number;
  } | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [dropFrameId, setDropFrameId] = useState<number | null>(null);
  const [snap, setSnap] = useState<SnapLine[]>([]);
  const [renamingFrameId, setRenamingFrameId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDelFrame, setConfirmDelFrame] = useState<DesignView | null>(null);
  // Multi-selección: ids de bloques seleccionados (canvas-wide).
  const [multiIds, setMultiIds] = useState<Set<string>>(new Set());
  // Rectángulo de selección por arrastre (en coords del lienzo).
  const [boxRect, setBoxRect] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);

  // Convierte coords de cliente a coords del lienzo (interior del wrapper).
  const clientToCanvas = (cx: number, cy: number): { x: number; y: number } => {
    const el = viewportRef.current;
    if (!el) return { x: 0, y: 0 };
    const r = el.getBoundingClientRect();
    return { x: (cx - r.left - pan.x) / zoom, y: (cy - r.top - pan.y) / zoom };
  };

  // Frames con sus rects — siempre el tamaño persistido (consistente
  // con la previa: lo que el viewer ve usa el mismo frame.w/h como
  // referencia para el anchoring).
  const framesWithRect = views.map((v, i) => ({
    view: v,
    rect: layouts[v.id]?.frame ?? defaultFrameRect(i)
  }));


  // ── Atajos ────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBlockId && activeFrameId != null) {
        e.preventDefault();
        onDeleteBlock(activeFrameId, selectedBlockId);
      } else if (e.key === 'Escape') {
        onSelectBlock(0, null);
      } else if ((e.ctrlKey || e.metaKey) && selectedBlockId && activeFrameId != null) {
        // Layer ordering:
        //   Ctrl + ]        → adelante un nivel
        //   Ctrl + Shift +] → al frente
        //   Ctrl + [        → atrás un nivel
        //   Ctrl + Shift +[ → al fondo
        if (e.key === ']') {
          e.preventDefault();
          onReorderBlock?.(activeFrameId, selectedBlockId, e.shiftKey ? 'front' : 'forward');
        } else if (e.key === '[') {
          e.preventDefault();
          onReorderBlock?.(activeFrameId, selectedBlockId, e.shiftKey ? 'back' : 'backward');
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedBlockId, activeFrameId, onDeleteBlock, onSelectBlock, onReorderBlock]);

  // ── Pan ──────────────────────────────────────────────────────────
  const startViewportPan = (e: ReactPointerEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setPanning({
      startClientX: e.clientX,
      startClientY: e.clientY,
      startPanX: pan.x,
      startPanY: pan.y
    });
  };
  const handleViewportPointerDown = (e: ReactPointerEvent<HTMLDivElement>): void => {
    if (cursorMode === 'pan' || e.button === 1) {
      startViewportPan(e);
      return;
    }
    // Multi-select: arrastrar dibuja rectángulo de selección.
    if (cursorMode === 'multi' && e.target === e.currentTarget) {
      e.preventDefault();
      const c = clientToCanvas(e.clientX, e.clientY);
      setBoxRect({ x1: c.x, y1: c.y, x2: c.x, y2: c.y });
      setMultiIds(new Set());
      onSelectBlock(0, null);
      return;
    }
    if (e.target !== e.currentTarget) return;
    startViewportPan(e);
    onSelectBlock(0, null);
  };

  // ── Box-select (rectángulo) ────────────────────────────────────────
  useEffect(() => {
    if (!boxRect) return;
    const move = (ev: PointerEvent): void => {
      const c = clientToCanvas(ev.clientX, ev.clientY);
      setBoxRect((r) => (r ? { ...r, x2: c.x, y2: c.y } : null));
    };
    const up = (): void => {
      // Calcular qué bloques (de cualquier frame) intersecan el rectángulo.
      setBoxRect((r) => {
        if (!r) return null;
        const lx = Math.min(r.x1, r.x2);
        const ly = Math.min(r.y1, r.y2);
        const rx = Math.max(r.x1, r.x2);
        const ry = Math.max(r.y1, r.y2);
        const ids = new Set<string>();
        for (const f of framesWithRect) {
          const layout = layouts[f.view.id];
          if (!layout) continue;
          for (const b of layout.blocks) {
            const bx = f.rect.x + b.x;
            const by = f.rect.y + FRAME_LABEL_HEIGHT + b.y;
            const bw = b.w;
            const bh = b.h;
            if (bx < rx && bx + bw > lx && by < ry && by + bh > ly) ids.add(b.id);
          }
        }
        setMultiIds(ids);
        return null;
      });
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boxRect, framesWithRect, layouts]);

  useEffect(() => {
    if (!panning) return;
    const move = (e: PointerEvent): void => {
      setPan({
        x: panning.startPanX + (e.clientX - panning.startClientX),
        y: panning.startPanY + (e.clientY - panning.startClientY)
      });
    };
    const up = (): void => setPanning(null);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [panning]);

  // ── Zoom (controlado) ──────────────────────────────────────────────
  const applyZoom = useCallback(
    (nextZoom: number, anchorClientX?: number, anchorClientY?: number): void => {
      const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, nextZoom));
      const el = viewportRef.current;
      if (el && anchorClientX != null && anchorClientY != null) {
        const rect = el.getBoundingClientRect();
        const ax = anchorClientX - rect.left;
        const ay = anchorClientY - rect.top;
        const k = clamped / zoom;
        setPan((p) => ({ x: ax - (ax - p.x) * k, y: ay - (ay - p.y) * k }));
      }
      onZoomChange(clamped, anchorClientX, anchorClientY);
    },
    [zoom, onZoomChange]
  );

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const handler = (e: WheelEvent): void => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = -e.deltaY * 0.0015;
        applyZoom(zoom * (1 + delta), e.clientX, e.clientY);
      } else {
        e.preventDefault();
        setPan((p) => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
      }
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [applyZoom, zoom]);

  // (framesWithRect ya está definido más arriba)

  // ── Drop ─────────────────────────────────────────────────────────
  const handleDragOver = (e: DragEvent<HTMLDivElement>, frameId: number): void => {
    if (Array.from(e.dataTransfer.types).includes(DRAG_MIME)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setDropFrameId(frameId);
    }
  };


  const handleDrop = (
    e: DragEvent<HTMLDivElement>,
    frameId: number,
    frameEl: HTMLDivElement | null,
    rect: FrameRect
  ): void => {
    e.preventDefault();
    setDropFrameId(null);
    const payload = e.dataTransfer.getData(DRAG_MIME) || e.dataTransfer.getData('text/plain');
    if (!payload) return;
    const elRect = frameEl?.getBoundingClientRect();
    if (!elRect) return;
    let size = { w: 200, h: 100 };
    let isPreset = false;
    let presetId: string | null = null;
    if (payload.startsWith('preset/')) {
      presetId = payload.slice('preset/'.length);
      const preset = getPreset(presetId);
      if (!preset) return;
      const def = getBlockDef(preset.type);
      if (!def) return;
      size = preset.defaultSize ?? def.defaultSize;
      isPreset = true;
    } else {
      const def: BlockDef | undefined = getBlockDef(payload);
      if (!def) return;
      size = def.defaultSize;
    }
    const rawX = (e.clientX - elRect.left) / zoom - size.w / 2;
    const rawY = (e.clientY - elRect.top) / zoom - size.h / 2;
    const x = Math.max(FRAME_PADDING, Math.min(rect.w - FRAME_PADDING - size.w, rawX));
    const y = Math.max(FRAME_PADDING, Math.min(rect.h - FRAME_PADDING - size.h, rawY));
    let block: Block | null = null;
    if (isPreset && presetId) {
      const preset = getPreset(presetId);
      block = preset ? instantiateFromPreset(preset, Math.round(x), Math.round(y)) : null;
    } else {
      block = instantiateBlock(payload, Math.round(x), Math.round(y));
    }
    if (block) onAddBlock(frameId, block);
  };

  // ── Drag handlers ────────────────────────────────────────────────
  const startBlockMove = (e: ReactPointerEvent<HTMLDivElement>, frameId: number, block: Block): void => {
    if (cursorMode === 'pan') return; // en modo mano, no se mueven bloques
    e.stopPropagation();
    // Si el bloque está dentro de la multi-selección, NO cambiamos la
    // selección; arrastrar mueve todos los seleccionados.
    if (!multiIds.has(block.id)) {
      onSelectBlock(frameId, block.id);
    }
    // Si hay multi-selección activa Y este bloque es parte, congelamos
    // las posiciones iniciales de TODOS los del grupo para mover juntos.
    let groupStart: Map<string, { frameId: number; x: number; y: number; w: number; h: number }> | undefined;
    if (multiIds.has(block.id) && multiIds.size > 1) {
      groupStart = new Map();
      for (const f of framesWithRect) {
        const layout = layouts[f.view.id];
        if (!layout) continue;
        for (const b of layout.blocks) {
          if (multiIds.has(b.id)) {
            groupStart.set(b.id, { frameId: f.view.id, x: b.x, y: b.y, w: b.w, h: b.h });
          }
        }
      }
    }
    setDrag({
      kind: 'block-move',
      frameId,
      blockId: block.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: block.x,
      startY: block.y,
      startW: block.w,
      startH: block.h,
      groupStartPositions: groupStart
    });
  };

  const startBlockResize = (e: ReactPointerEvent<HTMLDivElement>, frameId: number, block: Block, axis: ResizeAxis): void => {
    e.stopPropagation();
    onSelectBlock(frameId, block.id);
    setDrag({
      kind: 'block-resize',
      frameId,
      blockId: block.id,
      axis,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: block.x,
      startY: block.y,
      startW: block.w,
      startH: block.h
    });
  };

  const startFrameMove = (e: ReactPointerEvent<HTMLDivElement>, frameId: number, rect: FrameRect): void => {
    if (cursorMode === 'pan') return;
    e.stopPropagation();
    onSelectFrame(frameId);
    setDrag({
      kind: 'frame-move',
      frameId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: rect.x,
      startY: rect.y,
      startW: rect.w,
      startH: rect.h
    });
  };

  const startFrameResizeH = (e: ReactPointerEvent<HTMLDivElement>, frameId: number, rect: FrameRect): void => {
    e.stopPropagation();
    e.preventDefault();
    onSelectFrame(frameId);
    setDrag({
      kind: 'frame-resize',
      frameId,
      axis: 'b',
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: rect.x,
      startY: rect.y,
      startW: rect.w,
      startH: rect.h
    });
  };

  // ── Snap entre bloques (within frame) ──────────────────────────────
  const computeBlockSnap = useCallback(
    (frameId: number, blockId: string, x: number, y: number, w: number, h: number) => {
      const frame = framesWithRect.find((f) => f.view.id === frameId);
      if (!frame) return { x, y, lines: [] as SnapLine[] };
      const layout = layouts[frameId] ?? { blocks: [] };
      const lines: SnapLine[] = [];

      // Snap candidates: padding (alineación segura), centro, padding-bottom.
      // Las líneas se dibujan exactamente sobre el borde del BLOQUE cuando
      // queda snapped — así "tocan" el borde visible del bloque.
      const bodyTop = frame.rect.y + FRAME_LABEL_HEIGHT;
      const bodyLeft = frame.rect.x;
      const bodyRight = frame.rect.x + frame.rect.w;
      const bodyBottom = bodyTop + frame.rect.h;
      const vCands: { val: number; pos: number; from: number; to: number }[] = [
        { val: FRAME_PADDING, pos: bodyLeft + FRAME_PADDING, from: bodyTop, to: bodyBottom },
        { val: frame.rect.w / 2 - w / 2, pos: bodyLeft + frame.rect.w / 2, from: bodyTop, to: bodyBottom },
        { val: frame.rect.w - FRAME_PADDING - w, pos: bodyRight - FRAME_PADDING, from: bodyTop, to: bodyBottom }
      ];
      const hCands: { val: number; pos: number; from: number; to: number }[] = [
        { val: FRAME_PADDING, pos: bodyTop + FRAME_PADDING, from: bodyLeft, to: bodyRight },
        { val: frame.rect.h / 2 - h / 2, pos: bodyTop + frame.rect.h / 2, from: bodyLeft, to: bodyRight },
        { val: frame.rect.h - FRAME_PADDING - h, pos: bodyBottom - FRAME_PADDING, from: bodyLeft, to: bodyRight }
      ];
      for (const b of layout.blocks) {
        if (b.id === blockId) continue;
        vCands.push(
          { val: b.x, pos: frame.rect.x + b.x, from: frame.rect.y + FRAME_LABEL_HEIGHT + Math.min(b.y, y), to: frame.rect.y + FRAME_LABEL_HEIGHT + Math.max(b.y + b.h, y + h) },
          { val: b.x + b.w - w, pos: frame.rect.x + b.x + b.w, from: frame.rect.y + FRAME_LABEL_HEIGHT + Math.min(b.y, y), to: frame.rect.y + FRAME_LABEL_HEIGHT + Math.max(b.y + b.h, y + h) }
        );
        hCands.push(
          { val: b.y, pos: frame.rect.y + FRAME_LABEL_HEIGHT + b.y, from: frame.rect.x + Math.min(b.x, x), to: frame.rect.x + Math.max(b.x + b.w, x + w) },
          { val: b.y + b.h - h, pos: frame.rect.y + FRAME_LABEL_HEIGHT + b.y + b.h, from: frame.rect.x + Math.min(b.x, x), to: frame.rect.x + Math.max(b.x + b.w, x + w) }
        );
      }
      let sx = x;
      let sy = y;
      for (const c of vCands) {
        if (Math.abs(x - c.val) <= SNAP_THRESHOLD / zoom) {
          sx = c.val;
          lines.push({ axis: 'v', pos: c.pos, from: c.from, to: c.to });
          break;
        }
      }
      for (const c of hCands) {
        if (Math.abs(y - c.val) <= SNAP_THRESHOLD / zoom) {
          sy = c.val;
          lines.push({ axis: 'h', pos: c.pos, from: c.from, to: c.to });
          break;
        }
      }
      return { x: sx, y: sy, lines };
    },
    [framesWithRect, layouts, zoom]
  );

  // ── Snap entre frames ─────────────────────────────────────────────
  // Las posiciones de los frames (rect.x/y) son del CONTENEDOR completo
  // (incluyendo la fila del label encima del body). Para que las guías
  // visuales caigan exactamente sobre el BORDE VISIBLE del body de cada
  // frame, alineamos coords del body con coords del body.
  const computeFrameSnap = useCallback(
    (frameId: number, x: number, y: number, w: number, h: number) => {
      const others = framesWithRect.filter((f) => f.view.id !== frameId);
      const lines: SnapLine[] = [];
      let sx = x;
      let sy = y;
      const LABEL = FRAME_LABEL_HEIGHT;
      // X (no afecta el label): bordes y centro del body.
      const myXs = [x, x + w / 2, x + w];
      // Y: bordes y centro del BODY (con offset del label).
      const myYTop = y + LABEL;
      const myYs = [myYTop, myYTop + h / 2, myYTop + h];
      const yOffsets = [0, h / 2, h];
      for (const o of others) {
        const oxs = [o.rect.x, o.rect.x + o.rect.w / 2, o.rect.x + o.rect.w];
        const oBodyTop = o.rect.y + LABEL;
        const oys = [oBodyTop, oBodyTop + o.rect.h / 2, oBodyTop + o.rect.h];
        for (let i = 0; i < myXs.length; i++) {
          for (const ox of oxs) {
            if (Math.abs(myXs[i] - ox) <= FRAME_SNAP_THRESHOLD / zoom) {
              sx = ox - (i === 0 ? 0 : i === 1 ? w / 2 : w);
              const yFrom = Math.min(myYTop, oBodyTop) - 80;
              const yTo = Math.max(myYTop + h, oBodyTop + o.rect.h) + 80;
              lines.push({ axis: 'v', pos: ox, from: yFrom, to: yTo });
            }
          }
        }
        for (let i = 0; i < myYs.length; i++) {
          for (const oy of oys) {
            if (Math.abs(myYs[i] - oy) <= FRAME_SNAP_THRESHOLD / zoom) {
              // y = oy - LABEL - offset (porque myYs[i] = y + LABEL + offset)
              sy = oy - LABEL - yOffsets[i];
              const xFrom = Math.min(x, o.rect.x) - 80;
              const xTo = Math.max(x + w, o.rect.x + o.rect.w) + 80;
              lines.push({ axis: 'h', pos: oy, from: xFrom, to: xTo });
            }
          }
        }
      }
      return { x: sx, y: sy, lines };
    },
    [framesWithRect, zoom]
  );

  // ── Pointer move durante drag ─────────────────────────────────────
  useEffect(() => {
    if (!drag) return;
    const move = (e: PointerEvent): void => {
      const dx = (e.clientX - drag.startClientX) / zoom;
      const dy = (e.clientY - drag.startClientY) / zoom;
      if (drag.kind === 'block-move') {
        // Si hay grupo: clampear el DELTA común para que la caja
        // envolvente del grupo no salga del padding del frame. Así la
        // distribución relativa se mantiene intacta (sin superposiciones)
        // y el grupo entero se detiene al llegar al borde.
        if (drag.groupStartPositions && drag.groupStartPositions.size > 1) {
          // bounding box por frame
          const byFrame = new Map<number, { minX: number; minY: number; maxR: number; maxB: number }>();
          drag.groupStartPositions.forEach((s) => {
            const cur = byFrame.get(s.frameId) ?? { minX: Infinity, minY: Infinity, maxR: -Infinity, maxB: -Infinity };
            cur.minX = Math.min(cur.minX, s.x);
            cur.minY = Math.min(cur.minY, s.y);
            cur.maxR = Math.max(cur.maxR, s.x + s.w);
            cur.maxB = Math.max(cur.maxB, s.y + s.h);
            byFrame.set(s.frameId, cur);
          });
          let cdx = dx;
          let cdy = dy;
          byFrame.forEach((g, frameId) => {
            const frame = framesWithRect.find((f) => f.view.id === frameId);
            if (!frame) return;
            const minDx = FRAME_PADDING - g.minX;
            const maxDx = frame.rect.w - FRAME_PADDING - g.maxR;
            const minDy = FRAME_PADDING - g.minY;
            const maxDy = frame.rect.h - FRAME_PADDING - g.maxB;
            cdx = Math.max(minDx, Math.min(maxDx, cdx));
            cdy = Math.max(minDy, Math.min(maxDy, cdy));
          });
          drag.groupStartPositions.forEach((start, blockId) => {
            onMoveBlock(start.frameId, blockId, Math.round(start.x + cdx), Math.round(start.y + cdy));
          });
          setSnap([]);
          return;
        }
        const frame = framesWithRect.find((f) => f.view.id === drag.frameId);
        let rawX = drag.startX + dx;
        let rawY = drag.startY + dy;
        const s = computeBlockSnap(drag.frameId, drag.blockId, rawX, rawY, drag.startW, drag.startH);
        rawX = s.x;
        rawY = s.y;
        if (frame) {
          // Clamp respetando el padding del frame.
          rawX = Math.max(FRAME_PADDING, Math.min(frame.rect.w - FRAME_PADDING - drag.startW, rawX));
          rawY = Math.max(FRAME_PADDING, Math.min(frame.rect.h - FRAME_PADDING - drag.startH, rawY));
        }
        setSnap(s.lines);
        onMoveBlock(drag.frameId, drag.blockId, Math.round(rawX), Math.round(rawY));
      } else if (drag.kind === 'block-resize') {
        const frame = framesWithRect.find((f) => f.view.id === drag.frameId);
        if (!frame) return;
        const a = drag.axis;
        const east = a === 'e' || a === 'ne' || a === 'se';
        const west = a === 'w' || a === 'nw' || a === 'sw';
        const north = a === 'n' || a === 'ne' || a === 'nw';
        const south = a === 's' || a === 'se' || a === 'sw';
        let nx = drag.startX;
        let ny = drag.startY;
        let nw = drag.startW;
        let nh = drag.startH;
        if (east) nw = Math.max(MIN_W, drag.startW + dx);
        if (west) {
          nx = drag.startX + dx;
          nw = Math.max(MIN_W, drag.startW - dx);
          if (nw === MIN_W) nx = drag.startX + drag.startW - MIN_W;
        }
        if (south) nh = Math.max(MIN_H, drag.startH + dy);
        if (north) {
          ny = drag.startY + dy;
          nh = Math.max(MIN_H, drag.startH - dy);
          if (nh === MIN_H) ny = drag.startY + drag.startH - MIN_H;
        }
        // Clamp respetando el padding del frame.
        const minX = FRAME_PADDING;
        const minY = FRAME_PADDING;
        const maxRight = frame.rect.w - FRAME_PADDING;
        const maxBottom = frame.rect.h - FRAME_PADDING;
        if (nx < minX) {
          nw -= minX - nx;
          nx = minX;
        }
        if (ny < minY) {
          nh -= minY - ny;
          ny = minY;
        }
        if (nx + nw > maxRight) nw = maxRight - nx;
        if (ny + nh > maxBottom) nh = maxBottom - ny;
        nw = Math.max(MIN_W, nw);
        nh = Math.max(MIN_H, nh);
        onResizeBlock(drag.frameId, drag.blockId, Math.round(nx), Math.round(ny), Math.round(nw), Math.round(nh));
      } else if (drag.kind === 'frame-move') {
        const rawX = drag.startX + dx;
        const rawY = drag.startY + dy;
        const s = computeFrameSnap(drag.frameId, rawX, rawY, drag.startW, drag.startH);
        setSnap(s.lines);
        onMoveFrame(drag.frameId, Math.round(s.x), Math.round(s.y));
      } else if (drag.kind === 'frame-resize') {
        // Sólo alto del frame.
        const h = Math.max(MIN_FRAME_H, Math.round(drag.startH + dy));
        onResizeFrame(drag.frameId, drag.startW, h);
      }
    };
    const up = (): void => {
      setDrag(null);
      setSnap([]);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [drag, zoom, onMoveBlock, onResizeBlock, onMoveFrame, onResizeFrame, computeBlockSnap, computeFrameSnap, framesWithRect]);

  // Grid de puntos
  const DOT = 80;
  const dotSize = DOT * zoom;
  const dotOffsetX = ((pan.x % dotSize) + dotSize) % dotSize;
  const dotOffsetY = ((pan.y % dotSize) + dotSize) % dotSize;

  const cursorClass = panning
    ? 'cursor-grabbing'
    : cursorMode === 'pan'
      ? 'cursor-grab'
      : cursorMode === 'multi'
        ? 'cursor-crosshair'
        : 'cursor-default';

  return (
    <div
      ref={viewportRef}
      onPointerDown={handleViewportPointerDown}
      className={cn('relative h-full w-full overflow-hidden bg-bg', cursorClass)}
      style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(var(--color-fg-faint) / 0.45) 1px, transparent 0)',
        backgroundSize: `${dotSize}px ${dotSize}px`,
        backgroundPosition: `${dotOffsetX}px ${dotOffsetY}px`
      }}
    >
      {/*
        Dos wrappers para tener calidad nítida en zoom:
          - Exterior: pan vía `transform: translate` (no afecta nitidez).
          - Interior: zoom vía CSS `zoom` (re-rasteriza el contenido al
            tamaño nuevo en vez de interpolar pixels → texto/SVG crisp).
      */}
      <div
        className="absolute left-0 top-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px)`,
          transformOrigin: '0 0',
          willChange: 'transform'
        } as React.CSSProperties}
      >
        <div
          className="relative"
          style={{
            zoom: zoom,
            textRendering: 'geometricPrecision' as React.CSSProperties['textRendering'],
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale'
          } as React.CSSProperties}
        >
        {framesWithRect.map(({ view, rect }) => {
          const layout = layouts[view.id] ?? { blocks: [] };
          const isActive = activeFrameId === view.id;
          const isDropTarget = dropFrameId === view.id;
          const isPrimary = primaryViewId === view.id;
          return (
            <div
              key={view.id}
              className="absolute"
              style={{
                left: rect.x,
                top: rect.y,
                width: rect.w,
                height: rect.h + FRAME_LABEL_HEIGHT
              }}
            >
              {/* Label arriba-izquierda — sin estrella de "principal" */}
              <div
                onPointerDown={(e) => startFrameMove(e, view.id, rect)}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectFrame(view.id);
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setRenamingFrameId(view.id);
                  setRenameValue(view.name);
                }}
                className={cn(
                  'flex h-[18px] cursor-move items-center gap-1.5 pl-0.5 text-[10.5px] font-medium',
                  isActive ? 'text-fg' : 'text-fg-muted'
                )}
                style={{ width: rect.w }}
                title="Arrastrar para mover · Doble click para renombrar"
              >
                {renamingFrameId === view.id ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => {
                      const v = renameValue.trim();
                      if (v && v !== view.name) onRenameFrame(view.id, v);
                      setRenamingFrameId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      if (e.key === 'Escape') setRenamingFrameId(null);
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                    className="min-w-0 max-w-[200px] bg-bg-muted px-1 text-[10.5px] outline-none"
                  />
                ) : (
                  <span className="truncate">{view.name}</span>
                )}
                {/* Eliminar vista solo desde el panel derecho. */}
              </div>

              {/* Cuerpo del frame */}
              <div
                onPointerDown={(e) => {
                  if (cursorMode === 'pan' || e.button === 1) return;
                  // En modo multi-select, arrastrar dentro del frame también
                  // dibuja el rectángulo de selección.
                  if (cursorMode === 'multi' && e.target === e.currentTarget) {
                    e.preventDefault();
                    e.stopPropagation();
                    const c = clientToCanvas(e.clientX, e.clientY);
                    setBoxRect({ x1: c.x, y1: c.y, x2: c.x, y2: c.y });
                    setMultiIds(new Set());
                    onSelectBlock(0, null);
                    return;
                  }
                  if (e.target === e.currentTarget) {
                    e.stopPropagation();
                    onSelectFrame(view.id);
                  }
                }}
                onDragOver={(e) => handleDragOver(e, view.id)}
                onDragLeave={() => setDropFrameId(null)}
                onDrop={(e) => handleDrop(e, view.id, e.currentTarget, rect)}
                className={cn(
                  // Igual que la vista previa: si el contenido excede el
                  // alto del frame, scroll dentro del frame.
                  'relative mt-[4px] overflow-auto rounded-md bg-page transition-shadow',
                  isActive ? 'shadow-md' : 'shadow-sm',
                  isDropTarget && 'shadow-lg'
                )}
                style={{ width: rect.w, height: rect.h }}
              >
                {layout.blocks.length === 0 && (
                  <div className="pointer-events-none flex h-full w-full items-center justify-center">
                    <p className="text-[12.5px] text-fg-faint">Arrastrá un componente acá</p>
                  </div>
                )}

                {layout.blocks.map((b) => {
                  const def = getBlockDef(b.type);
                  if (!def) return null;
                  const selected = b.id === selectedBlockId && activeFrameId === view.id;
                  const inMulti = multiIds.has(b.id);
                  const resize = def.resize ?? 'both';
                  const handles = handlesFor(resize);
                  return (
                    <div
                      key={b.id}
                      onPointerDown={(e) => startBlockMove(e, view.id, b)}
                      onClick={(e) => e.stopPropagation()}
                      onDoubleClick={(e) => e.stopPropagation()}
                      className={cn(
                        'absolute select-none',
                        cursorMode === 'pan' ? 'cursor-grab' : 'cursor-move'
                      )}
                      style={{
                        left: b.x,
                        top: b.y,
                        width: b.w,
                        height: b.h,
                        willChange: 'transform',
                        userSelect: 'none',
                        // Distintivo de multi-selección: outline DENTRO
                        // del bloque (outline-offset negativo) + tinte
                        // primary 30%. Outline-offset negativo evita que
                        // el bg-page del frame body lo tape parcialmente.
                        outline: inMulti ? '2px solid rgb(var(--color-primary-500))' : undefined,
                        outlineOffset: inMulti ? '-2px' : undefined,
                        backgroundColor: inMulti ? 'rgb(var(--color-primary-500) / 0.30)' : undefined
                      }}
                      title={def.label}
                    >
                      <div className="pointer-events-none h-full w-full select-none">
                        {def.render(b.props, { isEditing: true })}
                      </div>

                      {selected &&
                        handles.map((axis) => {
                          const cfg = HANDLES.find((h) => h.axis === axis);
                          if (!cfg) return null;
                          return (
                            <div
                              key={axis}
                              onPointerDown={(ev) => {
                                ev.stopPropagation();
                                startBlockResize(ev, view.id, b, axis);
                              }}
                              onClick={(ev) => ev.stopPropagation()}
                              className={cn(
                                'absolute h-[7px] w-[7px] rounded-full bg-primary',
                                cfg.cursor
                              )}
                              style={cfg.style}
                              title={`Redimensionar (${axis})`}
                            />
                          );
                        })}
                    </div>
                  );
                })}

                {/* Asa para cambiar el alto del frame */}
                <div
                  onPointerDown={(e) => startFrameResizeH(e, view.id, rect)}
                  onClick={(e) => e.stopPropagation()}
                  className="group absolute bottom-0 left-0 flex h-2 w-full cursor-ns-resize items-end justify-center"
                  title="Arrastrar para cambiar el alto"
                >
                  <span className="mb-0.5 h-1 w-12 rounded-full bg-fg-faint/40 transition-colors group-hover:bg-fg-faint" />
                </div>
              </div>
            </div>
          );
        })}

        {/* Snap guides: color fg-muted neutro (no primary). */}
        {snap.map((line, i) =>
          line.axis === 'v' ? (
            <div
              key={i}
              className="pointer-events-none absolute bg-primary/80"
              style={{ left: line.pos, top: line.from, width: 1, height: line.to - line.from }}
            />
          ) : (
            <div
              key={i}
              className="pointer-events-none absolute bg-primary/80"
              style={{ top: line.pos, left: line.from, height: 1, width: line.to - line.from }}
            />
          )
        )}

        {/* Rectángulo de selección por arrastre */}
        {boxRect && (
          <div
            className="pointer-events-none absolute bg-fg-muted/10 ring-1 ring-fg-muted/40"
            style={{
              left: Math.min(boxRect.x1, boxRect.x2),
              top: Math.min(boxRect.y1, boxRect.y2),
              width: Math.abs(boxRect.x2 - boxRect.x1),
              height: Math.abs(boxRect.y2 - boxRect.y1)
            }}
          />
        )}
        </div>
      </div>

      {confirmDelFrame && (
        <Alert
          type="confirm"
          title="Eliminar vista"
          message={`¿Querés eliminar la vista "${confirmDelFrame.name}"? Esta acción no se puede deshacer.`}
          confirmText="ELIMINAR"
          cancelText="CANCELAR"
          onConfirm={() => {
            const id = confirmDelFrame.id;
            setConfirmDelFrame(null);
            onRemoveFrame(id);
          }}
          onCancel={() => setConfirmDelFrame(null)}
          onClose={() => setConfirmDelFrame(null)}
        />
      )}
    </div>
  );
}
