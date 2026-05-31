export const THEME_MODES = ['light', 'dark'];

export function createPreferences({
  mode = 'light',
  fontFamily = 'inter',
  accentHex = '#295072'
} = {}) {
  return { mode, fontFamily, accentHex };
}
