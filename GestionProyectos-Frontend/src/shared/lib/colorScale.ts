export interface Rgb {
  r: number;
  g: number;
  b: number;
}

export type ScaleKey = 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export type ColorScale = Record<ScaleKey, string>;

type MixTarget = 'white' | 'black';

interface MixSpec {
  with: MixTarget;
  t: number;
}

function hexToRgb(hex: string): Rgb {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16)
  };
}

function rgbToHex({ r, g, b }: Rgb): string {
  const toHex = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function mix(c1: Rgb, c2: Rgb, t: number): Rgb {
  // t = 0 -> c1; t = 1 -> c2
  return {
    r: c1.r * (1 - t) + c2.r * t,
    g: c1.g * (1 - t) + c2.g * t,
    b: c1.b * (1 - t) + c2.b * t
  };
}

// HSL ↔ RGB para poder fijar luminosidades target perceptualmente uniformes
// (lo que RGB-mix no logra cuando el color base ya es oscuro).
interface Hsl {
  h: number; // 0..360
  s: number; // 0..1
  l: number; // 0..1
}
function rgbToHsl({ r, g, b }: Rgb): Hsl {
  const R = r / 255,
    G = g / 255,
    B = b / 255;
  const max = Math.max(R, G, B),
    min = Math.min(R, G, B);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === R) h = ((G - B) / d + (G < B ? 6 : 0)) * 60;
  else if (max === G) h = ((B - R) / d + 2) * 60;
  else h = ((R - G) / d + 4) * 60;
  return { h, s, l };
}
function hueToRgb(p: number, q: number, t: number): number {
  let x = t;
  if (x < 0) x += 1;
  if (x > 1) x -= 1;
  if (x < 1 / 6) return p + (q - p) * 6 * x;
  if (x < 1 / 2) return q;
  if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
  return p;
}
function hslToRgb({ h, s, l }: Hsl): Rgb {
  if (s === 0) return { r: l * 255, g: l * 255, b: l * 255 };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const H = h / 360;
  return {
    r: hueToRgb(p, q, H + 1 / 3) * 255,
    g: hueToRgb(p, q, H) * 255,
    b: hueToRgb(p, q, H - 1 / 3) * 255
  };
}

const WHITE: Rgb = { r: 255, g: 255, b: 255 };
const BLACK: Rgb = { r: 0, g: 0, b: 0 };

// Mezcla calibrada para reproducir la paleta verde por defecto:
//   50 = mix(base, white, 0.90) → ~rgb(230, 241, 236) para #295072
//   900 = mix(base, black, 0.56) → ~rgb(0, 46, 29)
const SHADE_MIXES: Record<ScaleKey, MixSpec | null> = {
  50: { with: 'white', t: 0.9 },
  100: { with: 'white', t: 0.74 },
  200: { with: 'white', t: 0.59 },
  300: { with: 'white', t: 0.45 },
  400: { with: 'white', t: 0.29 },
  500: { with: 'white', t: 0.14 },
  600: null, // base
  700: { with: 'black', t: 0.19 },
  800: { with: 'black', t: 0.37 },
  900: { with: 'black', t: 0.56 }
};

export const SCALE_KEYS: ScaleKey[] = [
  50, 100, 200, 300, 400, 500, 600, 700, 800, 900
];

function buildScale(hex: string, table: Record<ScaleKey, MixSpec | null>): ColorScale {
  const base = hexToRgb(hex);
  const out = {} as ColorScale;
  for (const key of SCALE_KEYS) {
    const m = table[key];
    if (!m) {
      out[key] = rgbToHex(base);
      continue;
    }
    const target = m.with === 'white' ? WHITE : BLACK;
    out[key] = rgbToHex(mix(base, target, m.t));
  }
  return out;
}

export function generateScaleFromHex(hex: string): ColorScale {
  return buildScale(hex, SHADE_MIXES);
}

// Escala en modo oscuro derivada por LUMINOSIDAD HSL (no por mezcla RGB).
//
// Con un brand oscuro como #295072, mezclar canales RGB con negro deja todas
// las shades bajas pegadas (rango RGB minúsculo) y las gráficas no logran
// diferenciar segmentos. Trabajando en HSL podemos fijar saltos de
// luminosidad PERCEPTUALMENTE UNIFORMES.
//
// Las shades 50-500 se distribuyen entre 0 y la luminosidad del brand
// (relativo, así funciona para cualquier hex). Las 700-900 entre el brand
// y 1. El brand 600 queda intacto (mismo hex que en modo claro) para que
// botones primary y demás no cambien al alternar de tema.
//
// Factor relativo al base. ej: 50 = baseL * 0.15.
const DARK_L_FACTOR_BELOW: Record<ScaleKey, number | null> = {
  50: 0.15,
  100: 0.3,
  200: 0.5,
  300: 0.65,
  400: 0.8,
  500: 0.92,
  600: null,
  700: null,
  800: null,
  900: null
};
// Factor relativo al rango (1 - baseL). ej: 700 = baseL + (1-baseL) * 0.35.
const DARK_L_FACTOR_ABOVE: Record<ScaleKey, number | null> = {
  50: null,
  100: null,
  200: null,
  300: null,
  400: null,
  500: null,
  600: null,
  700: 0.4,
  800: 0.52, // antes 0.68 → quedaba casi blanco
  900: 0.78 // antes 0.88 → bajado para no luxar demasiado
};

export function generateDarkScaleFromHex(hex: string): ColorScale {
  const baseRgb = hexToRgb(hex);
  const baseHsl = rgbToHsl(baseRgb);
  const baseL = baseHsl.l;
  const out = {} as ColorScale;
  for (const key of SCALE_KEYS) {
    const below = DARK_L_FACTOR_BELOW[key];
    const above = DARK_L_FACTOR_ABOVE[key];
    let l: number;
    if (below != null) {
      l = baseL * below;
    } else if (above != null) {
      l = baseL + (1 - baseL) * above;
    } else {
      out[key] = rgbToHex(baseRgb); // 600 — brand intacto
      continue;
    }
    // Saturación: la bajamos un poco en extremos para que las shades muy
    // claras (l ≈ 0.9) no se laven a un color muy desaturado y las muy
    // oscuras (l ≈ 0.04) no parezcan ruido neutro.
    const distFromMid = Math.abs(l - 0.5);
    const satScale = 1 - distFromMid * 0.5;
    out[key] = rgbToHex(hslToRgb({ h: baseHsl.h, s: baseHsl.s * satScale, l }));
  }
  return out;
}

export function isValidHex(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^#?[0-9a-fA-F]{6}$/.test(value);
}

export function normalizeHex(value: string | null | undefined): string {
  if (!value) return '#000000';
  return value.startsWith('#') ? value : `#${value}`;
}

/**
 * Devuelve los canales RGB (formato "R G B" para CSS) del color
 * (blanco u oscuro) que mejor contrasta con el hex recibido. Útil para
 * texto/iconos sobre fondos primary dinámicos.
 */
export function getContrastChannels(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.58 ? '15 23 42' : '255 255 255';
}
