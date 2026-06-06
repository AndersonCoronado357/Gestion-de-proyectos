import { TryHttpAdapter } from '../exit/try.http.adapter.js';

export interface BuildTryApiOptions {
  token?: string;
}

export const buildTryApi = ({ token }: BuildTryApiOptions = {}) =>
  new TryHttpAdapter({ token });
