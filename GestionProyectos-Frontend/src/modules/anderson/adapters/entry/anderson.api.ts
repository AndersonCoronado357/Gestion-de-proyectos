import { AndersonHttpAdapter } from '../exit/anderson.http.adapter.js';

export interface BuildAndersonApiOptions {
  token?: string;
}

export const buildAndersonApi = ({ token }: BuildAndersonApiOptions = {}) =>
  new AndersonHttpAdapter({ token });
