// Tipos del editor visual: estructura de bloques y layouts.
//
// `LayoutContent` es lo que se guarda como JSON en design_views.content_desktop
// y content_mobile. Cada vista tiene DOS layouts independientes (uno por
// breakpoint) y el editor escribe en uno o el otro según el modo activo.

export type Breakpoint = 'desktop' | 'mobile';

/** Acción que ejecuta un bloque interactivo (un botón, por ejemplo). */
export interface BlockAction {
  /** "Ir a otra vista del mismo proyecto". `null` = sin acción. */
  navigateToViewId?: number | null;
}

/** Props específicas de cada tipo de bloque. Estructura abierta. */
export type BlockProps = Record<string, unknown> & {
  action?: BlockAction;
};

/** Una pieza colocada en el lienzo, con posición y tamaño en píxeles. */
export interface Block {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  props: BlockProps;
}

/** Posición + tamaño del frame de UNA vista dentro del lienzo infinito. */
export interface FrameRect {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Si true, el contenido del frame puede tener scroll vertical. */
  scroll?: boolean;
}

/** Contenido de UN layout (desktop o mobile) de UNA vista. */
export interface LayoutContent {
  blocks: Block[];
  /** Alto extra del lienzo en píxeles (cuando hace falta más espacio). */
  canvasHeight?: number;
  /** Posición del frame en el lienzo infinito (multi-frame estilo Figma). */
  frame?: FrameRect;
}

/** Dimensiones por defecto al crear un frame nuevo.
 *  Apuntan a una pantalla full-HD para que los frames nuevos se vean
 *  responsivos en la mayoría de monitores. El editor y la previa
 *  crecen al viewport real, así que estos valores son una base.  */
export const DEFAULT_FRAME_SIZE = { width: 1600, height: 900 };

/** Padding interno por defecto de un frame (espaciado del tema). */
export const FRAME_PADDING = 24;

/** Dimensiones nominales del lienzo por breakpoint (legacy). */
export const CANVAS_SIZES: Record<Breakpoint, { width: number; height: number }> = {
  desktop: { width: DEFAULT_FRAME_SIZE.width, height: DEFAULT_FRAME_SIZE.height },
  mobile: { width: 390, height: 760 }
};

/** Dimensiones reales de un iPhone "promedio" en CSS px para preview mobile. */
export const MOBILE_DEVICE = {
  portrait: { width: 390, height: 844 },
  landscape: { width: 844, height: 390 }
};

export function emptyLayout(): LayoutContent {
  return { blocks: [] };
}

export function parseLayout(raw: string | null | undefined): LayoutContent {
  if (!raw) return emptyLayout();
  try {
    const parsed = JSON.parse(raw) as Partial<LayoutContent>;
    return {
      blocks: Array.isArray(parsed.blocks) ? (parsed.blocks as Block[]) : [],
      canvasHeight: typeof parsed.canvasHeight === 'number' ? parsed.canvasHeight : undefined
    };
  } catch {
    return emptyLayout();
  }
}

export function serializeLayout(content: LayoutContent): string {
  return JSON.stringify(content);
}
