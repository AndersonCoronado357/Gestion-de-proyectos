import { PreferencesHttpAdapter } from '../exit/preferences.http.adapter.js';

export interface BuildPreferencesApiOptions {
  token?: string;
}

export const buildPreferencesApi = ({ token }: BuildPreferencesApiOptions = {}) =>
  new PreferencesHttpAdapter({ token });
