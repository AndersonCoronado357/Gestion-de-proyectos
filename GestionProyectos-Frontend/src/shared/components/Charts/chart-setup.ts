// Registro de Chart.js + utilidades de color y TOOLTIP EXTERNO con caret.
//
// El tooltip es un <div> HTML pegado al <body> (position:fixed, z-index máximo)
// → nunca se recorta ni queda detrás. Lleva "muesquita" (caret) y, en modo
// `follow`, SIGUE EL MOUSE (positioner 'cursor') mostrando solo la serie más
// cercana — igual que el tooltip del Apps Script. Colores leídos del tema →
// gráficas totalmente dinámicas (accent + modo oscuro).

import { useEffect, useMemo, useState } from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  LineElement,
  PointElement,
  BarElement,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  Tooltip,
  Legend,
  Filler,
  BarController,
  LineController,
  DoughnutController,
  RadarController,
  PolarAreaController,
  BubbleController,
  Interaction
} from 'chart.js';
import type {
  ChartType,
  TooltipPositionerFunction,
  InteractionModeFunction
} from 'chart.js';
import { getRelativePosition } from 'chart.js/helpers';

ChartJS.register(
  ArcElement,
  LineElement,
  PointElement,
  BarElement,
  CategoryScale,
  LinearScale,
  RadialLinearScale,
  Tooltip,
  Legend,
  Filler,
  BarController,
  LineController,
  DoughnutController,
  RadarController,
  PolarAreaController,
  BubbleController
);

// Animaciones más ágiles (el default de 1s se sentía lento).
if (ChartJS.defaults.animation) {
  ChartJS.defaults.animation.duration = 350;
}

// Positioner que devuelve la posición del cursor → el tooltip persigue el mouse.
declare module 'chart.js' {
  interface TooltipPositionerMap {
    cursor: TooltipPositionerFunction<ChartType>;
  }
  interface InteractionModeMap {
    belowLine: InteractionModeFunction;
  }
}
Tooltip.positioners.cursor = function (_items, eventPosition) {
  return eventPosition;
};

// Modo "bajo la línea": el tooltip/clic SOLO responde si el cursor está sobre o
// por DEBAJO de una curva (dentro de su área), nunca por encima. Sigue la curva
// que el cursor tiene justo arriba. Para LineChart.
Interaction.modes.belowLine = function (chart, e) {
  const pos = getRelativePosition(e, chart);
  let chosen: ReturnType<InteractionModeFunction> = [];
  let bestGap = Infinity;
  chart.data.datasets.forEach((_, di) => {
    const meta = chart.getDatasetMeta(di);
    if (meta.hidden) return;
    const pts = meta.data as Array<{ x: number; y: number }>;
    if (!pts || pts.length < 2) return;
    let lineY: number | null = null;
    let nearestIdx = 0;
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]!;
      const b = pts[i + 1]!;
      const lo = Math.min(a.x, b.x);
      const hi = Math.max(a.x, b.x);
      if (pos.x >= lo && pos.x <= hi) {
        const t = b.x === a.x ? 0 : (pos.x - a.x) / (b.x - a.x);
        lineY = a.y + t * (b.y - a.y);
        nearestIdx = t < 0.5 ? i : i + 1;
        break;
      }
    }
    if (lineY == null) return;
    const gap = pos.y - lineY; // >= 0 → el cursor está debajo de la línea
    if (gap >= -6 && gap < bestGap) {
      bestGap = gap;
      chosen = [{ element: pts[nearestIdx] as never, datasetIndex: di, index: nearestIdx }];
    }
  });
  return chosen;
};

export interface ChartDatum {
  label: string;
  value: number;
  color?: string;
}
export interface LineSeries {
  label?: string;
  color?: string;
  points: number[];
  fill?: boolean;
  dashed?: boolean;
}
export interface GanttTask {
  label: string;
  start: number;
  end: number;
  color?: string;
}

function cssVar(name: string): string {
  if (typeof document === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function rgbToken(name: string, alpha = 1): string {
  const ch = cssVar(name);
  if (!ch) return alpha < 1 ? `rgba(128,128,128,${alpha})` : 'rgb(128,128,128)';
  const parts = ch.split(/\s+/).join(', ');
  return alpha < 1 ? `rgba(${parts}, ${alpha})` : `rgb(${parts})`;
}

export function withAlpha(color: string, alpha: number): string {
  const m = color.match(/^rgb\(([^)]+)\)$/);
  return m ? `rgba(${m[1]}, ${alpha})` : color;
}

export interface ChartColors {
  palette: string[];
  text: string;
  muted: string;
  faint: string;
  grid: string;
  surface: string;
  bg: string;
}

// ── Tooltip externo (singleton pegado al body, con caret) ───────────────
let tipEl: HTMLDivElement | null = null;
let tipContent: HTMLDivElement | null = null;
let tipCaret: HTMLDivElement | null = null;

function ensureTip(): {
  el: HTMLDivElement;
  content: HTMLDivElement;
  caret: HTMLDivElement;
} {
  if (!tipEl || !document.body.contains(tipEl)) {
    tipEl = document.createElement('div');
    tipEl.style.cssText =
      'position:fixed;z-index:2147483647;pointer-events:none;opacity:0;transition:opacity .1s ease;';
    tipContent = document.createElement('div');
    tipCaret = document.createElement('div');
    tipCaret.style.position = 'absolute';
    tipCaret.style.width = '0';
    tipCaret.style.height = '0';
    tipEl.appendChild(tipContent);
    tipEl.appendChild(tipCaret);
    document.body.appendChild(tipEl);
  }
  return { el: tipEl, content: tipContent!, caret: tipCaret! };
}

/** Apaga el tooltip externo singleton — útil cuando cambia el estado de
 *  selección de un chart y el tooltip queda "pegado". */
export function hideExternalTooltip(): void {
  if (tipEl) tipEl.style.opacity = '0';
}

export function externalTooltip(context: { chart: ChartJS; tooltip: any }): void {
  const { chart, tooltip } = context;
  const { el, content, caret } = ensureTip();

  if (!tooltip || tooltip.opacity === 0) {
    el.style.opacity = '0';
    return;
  }

  const bg = rgbToken('--color-bg');
  const text = rgbToken('--color-fg');
  const muted = rgbToken('--color-fg-muted');
  const border = rgbToken('--color-border');

  const title: string[] = tooltip.title || [];
  const body: Array<{ lines: string[] }> = tooltip.body || [];
  const labelColors: Array<{ backgroundColor?: string; borderColor?: string }> =
    tooltip.labelColors || [];

  const head = title.length
    ? `<div style="font-size:11px;font-weight:700;color:${muted};margin-bottom:3px;white-space:nowrap;">${title.join(' ')}</div>`
    : '';
  const rows = body
    .map((b, i) => {
      const lc = labelColors[i] || {};
      const dot = lc.backgroundColor || lc.borderColor || muted;
      return (
        `<div style="display:flex;align-items:center;gap:7px;margin-top:2px;white-space:nowrap;">` +
        `<span style="width:9px;height:9px;border-radius:3px;background:${dot};flex:0 0 auto;"></span>` +
        `<span style="color:${text};font-weight:500;">${(b.lines || []).join(' ')}</span></div>`
      );
    })
    .join('');

  content.innerHTML = head + rows;
  el.style.background = bg;
  el.style.border = `1px solid ${border}`;
  el.style.borderRadius = '12px';
  el.style.boxShadow = '0 12px 32px -8px rgba(0,0,0,.30), 0 2px 8px rgba(0,0,0,.12)';
  el.style.padding = '9px 12px';
  el.style.font = '12px Inter, system-ui, sans-serif';

  const rect = chart.canvas.getBoundingClientRect();
  const vx = rect.left + tooltip.caretX;
  const vy = rect.top + tooltip.caretY;
  const tw = el.offsetWidth;
  const th = el.offsetHeight;
  const gap = 10;

  let above = true;
  let top = vy - th - gap;
  if (top < 8) {
    above = false;
    top = vy + gap;
  }
  let left = vx - tw / 2;
  left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
  top = Math.max(8, Math.min(top, window.innerHeight - th - 8));
  el.style.left = `${left}px`;
  el.style.top = `${top}px`;

  // Caret apuntando al punto/cursor.
  const caretLeft = Math.max(12, Math.min(vx - left, tw - 12));
  caret.style.left = `${caretLeft - 6}px`;
  caret.style.borderLeft = '6px solid transparent';
  caret.style.borderRight = '6px solid transparent';
  if (above) {
    caret.style.top = 'auto';
    caret.style.bottom = '-6px';
    caret.style.borderTop = `6px solid ${bg}`;
    caret.style.borderBottom = 'none';
  } else {
    caret.style.bottom = 'auto';
    caret.style.top = '-6px';
    caret.style.borderBottom = `6px solid ${bg}`;
    caret.style.borderTop = 'none';
  }

  el.style.opacity = '1';
}

/** Config de tooltip: desactiva el nativo y usa el externo (HTML), que SIGUE
 *  EL CURSOR. Por defecto SOLO sobre el elemento (intersect) → barras/dona/etc.
 *  no muestran nada en zonas blancas. Con `along:true` (líneas/araña) aparece a
 *  lo largo de toda la línea y bajo su área, no solo en los puntos. */
export function tooltipPlugin(opts?: { along?: boolean; belowLine?: boolean }) {
  const base = { enabled: false, external: externalTooltip, position: 'cursor' as const };
  if (opts?.belowLine) {
    return { ...base, mode: 'belowLine' as const, intersect: false };
  }
  return { ...base, mode: 'nearest' as const, intersect: !opts?.along };
}

/** Tope "bonito" para fijar el eje a partir de TODOS los datos → el máximo no
 *  cambia al ocultar/seleccionar una serie. */
export function niceMax(values: number[]): number | undefined {
  const raw = Math.max(...values.filter((v) => Number.isFinite(v)));
  if (!Number.isFinite(raw) || raw <= 0) return undefined;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  for (const f of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) {
    if (f * pow >= raw) return f * pow;
  }
  return 10 * pow;
}

/** onClick para Chart.js: llama onSelect(index) al hacer click en un elemento. */
export function clickHandler(
  onSelect?: (index: number) => void
): ((event: unknown, elements: Array<{ index: number }>) => void) | undefined {
  if (!onSelect) return undefined;
  return (_event, elements) => {
    if (elements && elements.length) onSelect(elements[0]!.index);
  };
}

export function useChartColors(): ChartColors {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const obs = new MutationObserver(() => setTick((t) => t + 1));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'style', 'class']
    });
    return () => obs.disconnect();
  }, []);

  return useMemo<ChartColors>(
    () => ({
      palette: [600, 400, 500, 300, 700, 200].map((s) =>
        rgbToken(`--color-primary-${s}`)
      ),
      text: rgbToken('--color-fg'),
      muted: rgbToken('--color-fg-muted'),
      faint: rgbToken('--color-fg-faint'),
      grid: rgbToken('--color-border-subtle'),
      surface: rgbToken('--color-bg-muted'),
      bg: rgbToken('--color-bg')
    }),
    [tick]
  );
}
