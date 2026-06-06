import { Anderson3HttpAdapter } from '../exit/anderson3.http.adapter.js';

export interface BuildAnderson3ApiOptions {
  token?: string;
}

export const buildAnderson3Api = ({ token }: BuildAnderson3ApiOptions = {}) =>
  new Anderson3HttpAdapter({ token });
