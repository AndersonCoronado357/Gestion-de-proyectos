// Renderiza una vista — el HTML que va a salir en producción.
//
// Estrategia simple, igual que cualquier módulo de la app:
//   - Outer flex column con padding responsive (p-3 sm:p-4 lg:p-6).
//   - Las filas (detectadas por solape vertical en el diseño) se
//     renderean como flex-row con flex-wrap.
//   - Cada bloque tiene `max-width: 100%` y `flex-shrink: 1` así se
//     achica en pantallas chicas. Sin overflow-x en la página.
//   - Los componentes ya son responsive en sí mismos (DataTable,
//     Button con fullWidth, etc.) — confiamos en ellos.

import { useEffect, useRef, useState } from 'react';
import { getBlockDef } from '../../lib/blockManifest.js';
import Tooltip from '../../../../shared/components/Tooltip/index.js';
import {
  DEFAULT_FRAME_SIZE,
  FRAME_PADDING,
  type Block,
  type LayoutContent
} from '../../types.js';

interface Props {
  layout: LayoutContent;
  onNavigate?: (viewId: number) => void;
  forcedWidth?: number;
}

interface RowInfo {
  blocks: Block[];
  align: 'flex-start' | 'flex-end' | 'center' | 'space-between';
  /** Gap vertical desde la fila anterior — preservado del diseño. */
  marginTop: number;
  /** Si esta fila es la PRIMERA que viene "del bottom" del diseño:
   *  se la empuja con margin-top: auto en el outer flex column, así
   *  va al final del viewport SIN un gap fijo gigante que rompa el
   *  responsive en pantallas chicas. */
  isFirstBottomAnchored: boolean;
}

function detectRows(blocks: Block[], frameW: number, frameH: number): RowInfo[] {
  if (blocks.length === 0) return [];
  const sorted = [...blocks].sort((a, b) => a.y - b.y);
  const groups: Block[][] = [];
  for (const b of sorted) {
    const target = groups.find((g) => {
      const top = Math.min(...g.map((x) => x.y));
      const bot = Math.max(...g.map((x) => x.y + x.h));
      return b.y < bot && b.y + b.h > top;
    });
    if (target) target.push(b);
    else groups.push([b]);
  }

  const ordered = groups
    .map((g) => [...g].sort((a, b) => a.x - b.x))
    .sort(
      (a, b) =>
        Math.min(...a.map((x) => x.y)) - Math.min(...b.map((x) => x.y))
    );

  // Detección de "bottom anchored": cuál es la PRIMERA fila cuya y top
  // está en el tercio inferior del diseño. Ésa se empuja con mt-auto
  // al fondo del viewport — todo lo de abajo de ella va al bottom.
  const bottomThreshold = frameH * 0.6;
  let firstBottomIdx = -1;
  for (let i = 0; i < ordered.length; i++) {
    const top = Math.min(...ordered[i].map((b) => b.y));
    if (top >= bottomThreshold) {
      firstBottomIdx = i;
      break;
    }
  }

  return ordered.map((row, idx) => {
    const first = row[0];
    const last = row[row.length - 1];
    const dLeft = first.x;
    const dRight = Math.max(0, frameW - (last.x + last.w));
    const thr = frameW * 0.08;

    let align: RowInfo['align'];
    if (row.length === 1) {
      if (Math.abs(dLeft - dRight) <= thr) align = 'center';
      else if (dLeft <= dRight) align = 'flex-start';
      else align = 'flex-end';
    } else {
      const leftStuck = dLeft < frameW * 0.15;
      const rightStuck = dRight < frameW * 0.15;
      if (leftStuck && rightStuck) align = 'space-between';
      else if (rightStuck) align = 'flex-end';
      else align = 'flex-start';
    }

    // marginTop = gap saved ENTRE filas (no aplicable cuando es la
    // primera bottom-anchored — esa usa mt-auto).
    const isFirstBottomAnchored = idx === firstBottomIdx;
    let marginTop = 0;
    if (idx > 0 && !isFirstBottomAnchored) {
      const prev = ordered[idx - 1];
      const prevBottom = Math.max(...prev.map((b) => b.y + b.h));
      const myTop = Math.min(...row.map((b) => b.y));
      marginTop = Math.max(0, myTop - prevBottom);
    }
    return { blocks: row, align, marginTop, isFirstBottomAnchored };
  });
}

function BlockNode({
  b,
  onNavigate,
  forced,
  maxAvailableH,
  frameW
}: {
  b: Block;
  onNavigate?: (viewId: number) => void;
  forced: boolean;
  /** Alto máximo disponible del wrapper de la vista. Bloques más altos
   *  que esto se cappean para evitar overflow. */
  maxAvailableH?: number;
  /** Ancho del frame de diseño — usado para detectar bloques que el
   *  usuario dimensionó al ancho completo del frame. */
  frameW: number;
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
  const lockH = def.resize === 'width' || def.resize === 'none';
  const lockW = def.resize === 'height' || def.resize === 'none';
  const w = lockW ? def.defaultSize.w : b.w;
  const h = lockH ? def.defaultSize.h : b.h;
  if (forced) {
    return (
      <div
        id={b.id}
        style={{ position: 'absolute', left: b.x, top: b.y, width: w, height: h }}
      >
        {node}
      </div>
    );
  }
  // Cap el alto al máximo disponible del wrapper de la vista — así un
  // chart guardado en una pantalla más alta no genera scroll cuando se
  // renderea en una más chica.
  const effH = maxAvailableH != null && h > maxAvailableH ? maxAvailableH : h;
  // Detecto si el bloque fue diseñado al ANCHO COMPLETO del frame
  // (i.e. b.x cerca del padding izquierdo y b.x+b.w cerca del padding
  // derecho). Si lo es, en preview debe ocupar 100% del wrapper (que ya
  // tiene su propio padding p-3 sm:p-4 lg:p-6 que respeta los bordes
  // de la página). Cualquier otro tamaño se renderea con su b.w fijo.
  const tol = 8;
  const isFullWidth =
    b.x <= FRAME_PADDING + tol && b.x + b.w >= frameW - FRAME_PADDING - tol;
  return (
    <div
      id={b.id}
      style={{
        width: isFullWidth ? '100%' : w,
        height: effH,
        maxWidth: '100%',
        flexShrink: 1,
        flexBasis: 'auto',
        minWidth: 0
      }}
    >
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

  const rows = detectRows(layout.blocks, designWidth, designHeight);

  const [forcedScale, setForcedScale] = useState(1);
  useEffect(() => {
    if (forcedWidth != null) setForcedScale(forcedWidth / designWidth);
  }, [forcedWidth, designWidth]);

  // Mide el alto disponible del wrapper (descontando el padding) para
  // capear bloques que vienen guardados más altos que el viewport actual.
  const outerRef = useRef<HTMLDivElement | null>(null);
  const [availH, setAvailH] = useState<number | undefined>(undefined);
  useEffect(() => {
    if (forcedWidth != null) return;
    const el = outerRef.current;
    if (!el) return;
    const update = (): void => {
      // clientHeight ya descuenta border, NO padding. Necesitamos el alto
      // CONTENIDO disponible — restamos el padding del computed style.
      const cs = getComputedStyle(el);
      const padT = parseFloat(cs.paddingTop) || 0;
      const padB = parseFloat(cs.paddingBottom) || 0;
      setAvailH(el.clientHeight - padT - padB);
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, [forcedWidth]);

  // ── Modo forced (mobile en el editor con un device frame) ──
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
              forced
              frameW={designWidth}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Modo normal: layout responsive natural (igual que cualquier
  //    módulo). Padding responsive en los 4 lados — equivale al
  //    FRAME_PADDING del editor, así los componentes con block.x>=24
  //    no quedan pegados al borde, y un chart con block.w == frame.w
  //    se rendea con maxWidth: 100% (= main.w - 48), respetando los
  //    24px de cada lado tal como se ve dentro del frame en el canvas.
  return (
    <div
      ref={outerRef}
      className="h-full w-full overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6"
      style={{ boxSizing: 'border-box' }}
    >
      <div className="flex flex-col" style={{ minHeight: '100%' }}>
        {rows.map((row, i) => (
          <div
            key={i}
            className="flex flex-row flex-wrap items-start gap-3"
            style={{
              justifyContent: row.align,
              width: '100%',
              marginTop: row.isFirstBottomAnchored ? 'auto' : row.marginTop
            }}
          >
            {row.blocks.map((b) => (
              <BlockNode
                key={b.id}
                b={b}
                onNavigate={onNavigate}
                forced={false}
                maxAvailableH={availH}
                frameW={designWidth}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
