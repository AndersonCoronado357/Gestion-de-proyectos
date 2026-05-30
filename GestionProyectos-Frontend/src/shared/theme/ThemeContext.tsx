import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode
} from 'react';
import {
  SCALE_KEYS,
  generateScaleFromHex,
  generateDarkScaleFromHex,
  getContrastChannels,
  isValidHex,
  type ColorScale
} from '../lib/colorScale.js';

export type ThemeMode = 'light' | 'dark';
export type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface FontDef {
  id: string;
  label: string;
  stack: string;
}

export interface ThemeContextValue {
  fonts: FontDef[];
  addFont: (font: FontDef) => void;
  fontFamily: string;
  setFontFamily: (id: string) => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
  accentHex: string;
  setAccentHex: (hex: string) => void;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  // Aplica varios cambios sin disparar render intermedios. Útil para
  // hidratar desde el servidor sin flash.
  applyAll: (prefs: {
    mode?: ThemeMode;
    accentHex?: string;
    fontFamily?: string;
    fontSize?: FontSize;
  }) => void;
  resetToDefaults: () => void;
  scale: ColorScale | null;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const DEFAULT_FONTS: FontDef[] = [
  { id: 'inter', label: 'Inter', stack: 'Inter, system-ui, sans-serif' },
  { id: 'system', label: 'Sistema', stack: 'system-ui, -apple-system, sans-serif' },
  { id: 'helvetica', label: 'Helvetica', stack: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  { id: 'arial', label: 'Arial', stack: 'Arial, sans-serif' },
  { id: 'verdana', label: 'Verdana', stack: 'Verdana, Geneva, sans-serif' },
  { id: 'tahoma', label: 'Tahoma', stack: 'Tahoma, sans-serif' },
  { id: 'trebuchet', label: 'Trebuchet MS', stack: '"Trebuchet MS", sans-serif' },
  { id: 'segoe', label: 'Segoe UI', stack: '"Segoe UI", sans-serif' },
  { id: 'calibri', label: 'Calibri', stack: 'Calibri, sans-serif' },
  { id: 'optima', label: 'Optima', stack: 'Optima, sans-serif' },
  { id: 'futura', label: 'Futura', stack: 'Futura, sans-serif' },
  { id: 'gill-sans', label: 'Gill Sans', stack: '"Gill Sans", sans-serif' },
  { id: 'lucida', label: 'Lucida Sans', stack: '"Lucida Sans Unicode", "Lucida Sans", sans-serif' },
  { id: 'times', label: 'Times', stack: 'Times, "Times New Roman", serif' },
  { id: 'georgia', label: 'Georgia', stack: 'Georgia, serif' },
  { id: 'garamond', label: 'Garamond', stack: 'Garamond, serif' },
  { id: 'palatino', label: 'Palatino', stack: 'Palatino, serif' },
  { id: 'bookman', label: 'Bookman', stack: 'Bookman, serif' },
  { id: 'cambria', label: 'Cambria', stack: 'Cambria, serif' },
  { id: 'baskerville', label: 'Baskerville', stack: 'Baskerville, serif' },
  { id: 'mono', label: 'Mono', stack: 'ui-monospace, "SF Mono", Consolas, monospace' },
  { id: 'courier', label: 'Courier New', stack: '"Courier New", monospace' },
  { id: 'consolas', label: 'Consolas', stack: 'Consolas, monospace' },
  { id: 'menlo', label: 'Menlo', stack: 'Menlo, monospace' },
  { id: 'andale', label: 'Andale Mono', stack: '"Andale Mono", monospace' }
];

const TEXT_SCALE: Record<FontSize, number> = {
  xs: 0.88,
  sm: 0.94,
  md: 1,
  lg: 1.08,
  xl: 1.16
};

// Defaults compartidos con el backend (modules/me/domain/preferences.types.ts).
const DEFAULT_MODE: ThemeMode = 'light';
const DEFAULT_ACCENT = '#295072';
const DEFAULT_FONT = 'inter';
const DEFAULT_SIZE: FontSize = 'md';

// La fuente de verdad de las preferencias de tema es la BASE DE DATOS.
// El AuthContext las aplica al entrar (vía /auth/me y /auth/login) y
// PreferencesSync persiste los cambios (PUT /me/preferences).  NO usamos
// localStorage para el tema — así no puede quedar un tema viejo "pegado".

function hexToChannels(hex: string): string {
  const c = hex.replace('#', '');
  return `${parseInt(c.slice(0, 2), 16)} ${parseInt(c.slice(2, 4), 16)} ${parseInt(c.slice(4, 6), 16)}`;
}

function mixWithBlackChannels(hex: string, t: number): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16) * (1 - t);
  const g = parseInt(c.slice(2, 4), 16) * (1 - t);
  const b = parseInt(c.slice(4, 6), 16) * (1 - t);
  return `${Math.round(r)} ${Math.round(g)} ${Math.round(b)}`;
}

function mixWithWhiteChannels(hex: string, t: number): string {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16);
  const g = parseInt(c.slice(2, 4), 16);
  const b = parseInt(c.slice(4, 6), 16);
  return `${Math.round(r + (255 - r) * t)} ${Math.round(g + (255 - g) * t)} ${Math.round(b + (255 - b) * t)}`;
}

type CssVars = Record<string, string>;

function lightVarsFromScale(scale: ColorScale): CssVars {
  return {
    '--color-bg': '255 255 255',
    // bg-muted se usa como fondo de inputs, hovers, zebra striping, etc.
    // Antes era 0.96 mix-with-white → imperceptible contra bg blanco.
    // 0.90 da un gris/tinte sutil pero claramente visible.
    '--color-bg-muted': mixWithWhiteChannels(scale[500], 0.9),
    '--color-fg': '15 23 42',
    '--color-fg-muted': '71 85 105',
    '--color-fg-subtle': '100 116 139',
    '--color-fg-faint': '148 163 184',
    '--color-border': '226 232 240',
    '--color-border-subtle': '241 245 249',
    '--color-surface-hover': mixWithWhiteChannels(scale[500], 0.93),
    // Fondo de página = tinte SUTIL del color elegido. 0.90 = un pelín más
    // claro que 0.875 (ni blanco como 0.95, ni tan marcado como 0.85).
    '--color-page-bg': mixWithWhiteChannels(scale[500], 0.9)
  };
}

function darkVarsFromScale(scale: ColorScale): CssVars {
  return {
    '--color-bg': mixWithBlackChannels(scale[500], 0.82),
    '--color-bg-muted': mixWithBlackChannels(scale[500], 0.7),
    '--color-fg': '244 247 252',
    '--color-fg-muted': '210 218 230',
    '--color-fg-subtle': '160 172 190',
    '--color-fg-faint': '120 135 155',
    '--color-border': mixWithBlackChannels(scale[500], 0.58),
    '--color-border-subtle': mixWithBlackChannels(scale[500], 0.74),
    '--color-surface-hover': mixWithBlackChannels(scale[500], 0.62),
    '--color-page-bg': mixWithBlackChannels(scale[500], 0.9)
  };
}

export interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Estado inicial = defaults.  La verdad vive en la DB: el AuthContext
  // aplica las preferencias del usuario (applyAll) en cuanto resuelve
  // /auth/me o /auth/login, mientras el ViewSkeleton tapa ese instante.
  const [fonts, setFonts] = useState<FontDef[]>(DEFAULT_FONTS);
  const [accentHex, setAccentHexState] = useState(DEFAULT_ACCENT);
  const [fontFamilyId, setFontFamilyIdState] = useState(DEFAULT_FONT);
  const [fontSize, setFontSizeState] = useState<FontSize>(DEFAULT_SIZE);
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);

  useEffect(() => {
    if (!isValidHex(accentHex)) return;
    const root = document.documentElement;
    const lightScale = generateScaleFromHex(accentHex);
    const activeScale =
      mode === 'dark' ? generateDarkScaleFromHex(accentHex) : lightScale;

    // Acumulamos todas las vars para aplicar al DOM Y persistirlas en
    // localStorage en una sola pasada — la próxima recarga el script
    // inline las lee y las aplica antes de que monte React.
    const allVars: Record<string, string> = {};

    SCALE_KEYS.forEach((k) => {
      allVars[`--color-primary-${k}`] = hexToChannels(activeScale[k]);
    });
    allVars['--color-on-primary'] = getContrastChannels(lightScale[600]);
    allVars['--color-on-primary-soft'] = getContrastChannels(activeScale[100]);

    const surfaceVars =
      mode === 'dark' ? darkVarsFromScale(lightScale) : lightVarsFromScale(lightScale);
    Object.assign(allVars, surfaceVars);

    Object.entries(allVars).forEach(([k, v]) => {
      root.style.setProperty(k, v);
    });
    root.dataset.theme = mode;
  }, [accentHex, mode]);

  useEffect(() => {
    const font = fonts.find((f) => f.id === fontFamilyId);
    document.body.style.fontFamily = font?.stack || 'Inter, system-ui, sans-serif';
  }, [fontFamilyId, fonts]);

  useEffect(() => {
    document.documentElement.style.fontSize = '';
    document.body.style.fontSize = '';
    (document.body.style as CSSStyleDeclaration & { zoom?: string }).zoom = '';
    document.documentElement.style.setProperty(
      '--text-scale',
      String(TEXT_SCALE[fontSize] ?? 1)
    );
  }, [fontSize]);

  const addFont = (font: FontDef) => setFonts((prev) => [...prev, font]);

  // Aplica varios valores "en bloque" — útil para hidratar desde el server.
  // React 18 batchea estos setX dentro del mismo turno: un solo render.
  const applyAll = useCallback(
    ({
      mode: m,
      accentHex: a,
      fontFamily: f,
      fontSize: s
    }: {
      mode?: ThemeMode;
      accentHex?: string;
      fontFamily?: string;
      fontSize?: FontSize;
    }) => {
      if (m) setModeState(m);
      if (a) setAccentHexState(a);
      if (f) setFontFamilyIdState(f);
      if (s) setFontSizeState(s);
    },
    []
  );

  const resetToDefaults = useCallback(() => {
    setModeState(DEFAULT_MODE);
    setAccentHexState(DEFAULT_ACCENT);
    setFontFamilyIdState(DEFAULT_FONT);
    setFontSizeState(DEFAULT_SIZE);
  }, []);

  const value: ThemeContextValue = {
    fonts,
    addFont,
    fontFamily: fontFamilyId,
    setFontFamily: setFontFamilyIdState,
    fontSize,
    setFontSize: setFontSizeState,
    accentHex,
    setAccentHex: setAccentHexState,
    mode,
    setMode: setModeState,
    applyAll,
    resetToDefaults,
    scale: isValidHex(accentHex) ? generateScaleFromHex(accentHex) : null
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>');
  return ctx;
}
