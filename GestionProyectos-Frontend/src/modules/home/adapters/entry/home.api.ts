import { HomeHttpAdapter } from '../exit/home.http.adapter.js';

export interface BuildHomeApiOptions {
  token?: string;
}

export const buildHomeApi = ({ token }: BuildHomeApiOptions = {}) =>
  new HomeHttpAdapter({ token });
