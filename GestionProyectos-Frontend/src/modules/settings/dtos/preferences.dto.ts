import type { ThemeMode } from '../../../shared/theme/ThemeContext.js';

export interface Preferences {
  mode: ThemeMode;
  fontFamily: string;
  accentHex: string;
}

export interface PreferencesDto {
  mode: ThemeMode;
  fontFamily: string;
  accentHex: string;
}

export function preferencesToDTO(prefs: Preferences): PreferencesDto {
  return {
    mode: prefs.mode,
    fontFamily: prefs.fontFamily,
    accentHex: prefs.accentHex
  };
}

export function preferencesFromDTO(dto?: Partial<PreferencesDto> | null): Preferences {
  return {
    mode: dto?.mode ?? 'light',
    fontFamily: dto?.fontFamily ?? 'inter',
    accentHex: dto?.accentHex ?? '#295072'
  };
}
