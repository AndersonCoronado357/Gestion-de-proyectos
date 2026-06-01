// Forma de las preferencias de UI persistidas por usuario.
// El front (ThemeContext) maneja exactamente este shape — mantengámoslos
// sincronizados.

export type ThemeMode = 'light' | 'dark';
export type FontSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export interface UiPreferences {
  mode: ThemeMode;
  accentHex: string;
  fontFamily: string;
  fontSize: FontSize;
}

export const DEFAULT_PREFERENCES: UiPreferences = {
  mode: 'light',
  accentHex: '#295072',
  fontFamily: 'inter',
  fontSize: 'md'
};
