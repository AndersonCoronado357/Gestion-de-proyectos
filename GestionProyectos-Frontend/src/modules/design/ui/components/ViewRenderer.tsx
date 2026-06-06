// Renderiza una vista — el HTML que va a salir en producción.
//
// Estrategia: SCALE-TO-FIT del canvas completo. Tomamos las dimensiones
// nativas del diseño (frame.w x frame.h) y las escalamos con
// `transform: scale(...)` para que ocupen exactamente el viewport
// disponible — sin recortes, sin scroll y SIN re-flow. Cada bloque
// queda en su (x, y, w, h) literal igual que en el pizarrón.
//
// Resultado: pizarrón = preview = página publicada. Visualmente
// idénticos a cualquier ancho de pantalla.

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { getBlockDef } from '../../lib/blockManifest.js';
import Tooltip from '../../../../shared/components/Tooltip/index.js';
import {
  DEFAULT_FRAME_SIZE,
  type Block,
  type LayoutContent
} from '../../types.js';

interface Props {
  layout: LayoutContent;
  onNavigate?: (viewId: number) => void;
  forcedWidth?: number;
}

function BlockNode({
  b,
  onNavigate,
  style
}: {
  b: Block;
  onNavigate?: (viewId: number) => void;
  style: CSSProperties;
}) {
  const def = getBlockDef(b.type);
  if (!def) return null;
  const hasTooltip = b.props.hasTooltip === true;
  const tooltipText =
    hasTooltip && typeof b.props.tooltip === 'string' ? b.props.tooltip.trim() : '';
  const inner = def.render(b.props, { isEditing: false, onNavigate });
  const node = tooltipText ? (
    <Tooltip content={tooltipText}>
      <div className="h-full w-full">{inner}</div>
    </Tooltip>
  ) : (
    inner
  );
  return (
    <div id={b.id} style={style}>
      {node}
    </div>
  );
}

export default function ViewRenderer({ layout, onNavigate, forcedWidth }: Props) {
  const designWidth = layout.frame?.w ?? DEFAULT_FRAME_SIZE.width;
  const designHeight =
    layout.frame?.h ??
    Math.max(
      DEFAULT_FRAME_SIZE.height,
      layout.blocks.reduce((m, b) => Math.max(m, b.y + b.h), 0)
    );

  // ── Modo forced (mobile en el editor con un device frame) ──
  const [forcedScale, setForcedScale] = useState(1);
  useEffect(() => {
    if (forcedWidth != null) setForcedScale(forcedWidth / designWidth);
  }, [forcedWidth, designWidth]);

  if (forcedWidth != null) {
    return (
      <div
        style={{
          width: forcedWidth,
          height: designHeight * forcedScale,
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            position: 'relative',
            width: designWidth,
            height: designHeight,
            transform: `scale(${forcedScale})`,
            transformOrigin: 'top left'
          }}
        >
          {layout.blocks.map((b) => (
            <BlockNode
              key={b.id}
              b={b}
              onNavigate={onNavigate}
              style={{
                position: 'absolute',
                left: b.x,
                top: b.y,
                width: b.w,
                height: b.h
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Modo normal: SCALE-TO-FIT. Medimos el wrapper, computamos el
  //    scale que hace que el canvas entero entre exactamente, sin
  //    recortar ni sobrar. Re-medimos en cada resize del viewport.
  const outerRef = useRef<HTMLDivElement | null>(null);
  const [sy, setSy] = useState(1);

  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const update = (): void => {
      const r = el.getBoundingClientRect();
      if (r.height === 0) return;
      // Y solo se achica si el viewport es más chico que designH;
      // nunca lo agrando. El ancho se maneja con porcentajes en cada
      // bloque (sin transform).
      setSy(r.height >= designHeight ? 1 : r.height / designHeight);
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, [designHeight]);

  // Cada bloque se posiciona en PORCENTAJES sobre el ancho (estira con
  // el viewport sin usar `transform: scale`, que rompe portals/selects/
  // hover-hit-testing). El alto y top son px multiplicados por `sy`.
  return (
    <div
      ref={outerRef}
      className="relative h-full w-full overflow-hidden"
      style={{ boxSizing: 'border-box' }}
    >
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: designHeight * sy
        }}
      >
        {layout.blocks.map((b) => (
          <BlockNode
            key={b.id}
            b={b}
            onNavigate={onNavigate}
            style={{
              position: 'absolute',
              left: `${(b.x / designWidth) * 100}%`,
              top: b.y * sy,
              width: `${(b.w / designWidth) * 100}%`,
              height: b.h * sy
            }}
          />
        ))}
      </div>
    </div>
  );
}
