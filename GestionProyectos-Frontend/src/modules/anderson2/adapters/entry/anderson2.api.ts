import { Anderson2HttpAdapter } from '../exit/anderson2.http.adapter.js';

export interface BuildAnderson2ApiOptions {
  token?: string;
}

export const buildAnderson2Api = ({ token }: BuildAnderson2ApiOptions = {}) =>
  new Anderson2HttpAdapter({ token });
