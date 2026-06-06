import { Anderson4HttpAdapter } from '../exit/anderson4.http.adapter.js';

export interface BuildAnderson4ApiOptions {
  token?: string;
}

export const buildAnderson4Api = ({ token }: BuildAnderson4ApiOptions = {}) =>
  new Anderson4HttpAdapter({ token });
