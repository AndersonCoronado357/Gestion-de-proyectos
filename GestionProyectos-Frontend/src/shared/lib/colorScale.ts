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

// Híbrido: los tonos "claros" (50-200) se vuelven oscuros con tinte del color
// para que selecciones/badges sigan visibles sobre fondo oscuro. Los tonos
// "base" (500-600) se mantienen igual para que botones y elementos primary
// no cambien al alternar de modo. Los tonos "oscuros" (700-900) se aclaran
// para usarse como texto/iconos sobre fondos oscuros.
const DARK_SHADE_MIXES: Record<ScaleKey, MixSpec | null> = {
  50: { with: 'black', t: 0.78 },
  100: { with: 'black', t: 0.62 },
  200: { with: 'black', t: 0.42 },
  300: { with: 'black', t: 0.24 },
  400: { with: 'black', t: 0.1 },
  500: null, // base
  600: null, // base — mantiene el color del botón intacto
  700: { with: 'white', t: 0.32 },
  800: { with: 'white', t: 0.55 },
  900: { with: 'white', t: 0.78 }
};

export function generateDarkScaleFromHex(hex: string): ColorScale {
  return buildScale(hex, DARK_SHADE_MIXES);
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
