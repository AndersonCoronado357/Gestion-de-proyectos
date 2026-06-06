import { AnderHttpAdapter } from '../exit/ander.http.adapter.js';

export interface BuildAnderApiOptions {
  token?: string;
}

export const buildAnderApi = ({ token }: BuildAnderApiOptions = {}) =>
  new AnderHttpAdapter({ token });
