// Cliente HTTP para las preferencias de UI del usuario actual.
//
// Endpoints:
//   GET  /me/preferences  → leer
//   PUT  /me/preferences  → actualizar (upsert)

import { http } from '../../shared/utils/http.js';

export interface RemoteUiPreferences {
  mode: 'light' | 'dark';
  accentHex: string;
  fontFamily: string;
  fontSize: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export async function fetchPreferences(): Promise<RemoteUiPreferences | null> {
  const data = await http<{ preferences: RemoteUiPreferences }>(
    '/me/preferences',
    { method: 'GET' }
  );
  return data?.preferences ?? null;
}

export async function updatePreferences(
  prefs: RemoteUiPreferences
): Promise<RemoteUiPreferences | null> {
  const data = await http<{ preferences: RemoteUiPreferences }>(
    '/me/preferences',
    { method: 'PUT', body: prefs }
  );
  return data?.preferences ?? null;
}
