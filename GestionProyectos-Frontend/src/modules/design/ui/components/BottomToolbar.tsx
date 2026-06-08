// Barra inferior flotante.
//   [Cursor] [Mano] | [Zoom −  100%  +] | [Nueva vista] [Contenedor]   ····   [Vista previa]
//
// "Vista previa" queda a la derecha separado con espacio del resto.

import { cn } from '../../../../shared/lib/cn.js';
import {
  ContainerIcon,
  CursorArrowRaysIcon,
  EyeIcon,
  FrameIcon,
  HandIcon,
  MultiSelectIcon
} from '../../../../shared/icons/index.js';

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
          <CursorArrowRaysIcon width={15} height={15} />
        </button>
        <button
          type="button"
          className={seg(cursorMode === 'pan')}
          onClick={() => onCursorMode('pan')}
          title="Mover el lienzo (mano)"
        >
          <HandIcon width={14} height={14} />
        </button>
        <button
          type="button"
          className={seg(cursorMode === 'multi')}
          onClick={() => onCursorMode('multi')}
          title="Selección múltiple (arrastrar rectángulo)"
        >
          <MultiSelectIcon width={14} height={14} />
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
          <FrameIcon width={14} height={14} /> Nueva vista
        </button>

        {/* Contenedor */}
        <button
          type="button"
          onClick={onAddContainer}
          title="Nuevo contenedor"
          className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-[12.5px] font-medium text-fg-muted outline-none transition-colors hover:bg-bg-muted hover:text-fg"
        >
          <ContainerIcon width={14} height={14} /> Contenedor
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
