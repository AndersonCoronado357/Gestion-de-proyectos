// Barra inferior flotante.
//   [Cursor] [Mano] | [Zoom −  100%  +] | [Nueva vista] [Contenedor]   ····   [Vista previa]
//
// "Vista previa" queda a la derecha separado con espacio del resto.

import { cn } from '../../../../shared/lib/cn.js';
import { EyeIcon } from '../../../../shared/icons/index.js';

export type CursorMode = 'select' | 'pan' | 'multi';

interface Props {
  cursorMode: CursorMode;
  onCursorMode: (m: CursorMode) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onAddView: () => void;
  onAddContainer: () => void;
  onPreview: () => void;
}

function CursorIcon() {
  // SVG provisto por el usuario (Heroicons cursor-arrow-rays).
  return (
    <svg
      width={15}
      height={15}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15.042 21.672 13.684 16.6m0 0-2.51 2.225.569-9.47 5.227 7.917-3.286-.672ZM12 2.25V4.5m5.834.166-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243-1.59-1.59"
      />
    </svg>
  );
}
function HandIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11V4a2 2 0 1 1 4 0v7M13 11V3a2 2 0 1 1 4 0v8M17 11V5a2 2 0 1 1 4 0v10a7 7 0 0 1-7 7h-1a7 7 0 0 1-7-7v-2.5L4 11a2 2 0 1 1 2-3l3 3" />
    </svg>
  );
}
function MultiSelectIcon() {
  // Rectángulo dashed con un punto: selección por arrastrar.
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 5h2M5 11h2M5 17h2M11 5h2M11 17h2M17 5h2M17 11h2M17 17h2" strokeDasharray="2 2" />
      <circle cx="14" cy="14" r="2.5" fill="currentColor" />
    </svg>
  );
}
function FrameIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  );
}
function BoxIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <path d="M3 9h18M9 21V9" />
    </svg>
  );
}

export default function BottomToolbar({
  cursorMode,
  onCursorMode,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onAddView,
  onAddContainer,
  onPreview
}: Props) {
  const seg = (active: boolean): string =>
    cn(
      'inline-flex h-9 w-9 items-center justify-center rounded-md outline-none transition-colors',
      active ? 'bg-bg-muted text-fg' : 'text-fg-muted hover:bg-bg-muted hover:text-fg'
    );

  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 -translate-x-1/2">
      <div className="pointer-events-auto flex items-center gap-2 rounded-xl bg-bg/95 px-2 py-1.5 shadow-lg backdrop-blur">
        {/* Modos de cursor */}
        <button
          type="button"
          className={seg(cursorMode === 'select')}
          onClick={() => onCursorMode('select')}
          title="Seleccionar"
        >
          <CursorIcon />
        </button>
        <button
          type="button"
          className={seg(cursorMode === 'pan')}
          onClick={() => onCursorMode('pan')}
          title="Mover el lienzo (mano)"
        >
          <HandIcon />
        </button>
        <button
          type="button"
          className={seg(cursorMode === 'multi')}
          onClick={() => onCursorMode('multi')}
          title="Selección múltiple (arrastrar rectángulo)"
        >
          <MultiSelectIcon />
        </button>

        <div className="mx-1" />

        {/* Zoom: − % + */}
        <button
          type="button"
          onClick={onZoomOut}
          title="Alejar"
          className="inline-flex h-9 w-7 items-center justify-center rounded-md text-fg-muted outline-none hover:bg-bg-muted hover:text-fg"
        >
          −
        </button>
        <button
          type="button"
          onClick={onZoomReset}
          title="Restablecer zoom"
          className="min-w-[46px] rounded-md px-1 text-center text-[11.5px] tabular-nums text-fg-muted outline-none hover:bg-bg-muted hover:text-fg"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={onZoomIn}
          title="Acercar"
          className="inline-flex h-9 w-7 items-center justify-center rounded-md text-fg-muted outline-none hover:bg-bg-muted hover:text-fg"
        >
          +
        </button>

        <div className="mx-1" />

        {/* Nueva vista */}
        <button
          type="button"
          onClick={onAddView}
          title="Nueva vista"
          className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-[12.5px] font-medium text-fg-muted outline-none transition-colors hover:bg-bg-muted hover:text-fg"
        >
          <FrameIcon /> Nueva vista
        </button>

        {/* Contenedor */}
        <button
          type="button"
          onClick={onAddContainer}
          title="Nuevo contenedor"
          className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-[12.5px] font-medium text-fg-muted outline-none transition-colors hover:bg-bg-muted hover:text-fg"
        >
          <BoxIcon /> Contenedor
        </button>

        {/* Espacio antes del CTA */}
        <div className="w-4" />

        <button
          type="button"
          onClick={onPreview}
          title="Abrir vista previa"
          className="inline-flex h-9 items-center gap-2 rounded-md bg-primary px-3.5 text-[12.5px] font-semibold text-on-primary outline-none transition-colors hover:bg-primary-700"
        >
          <EyeIcon width={14} height={14} /> Vista previa
        </button>
      </div>
    </div>
  );
}
