import { PruebaHttpAdapter } from '../exit/prueba.http.adapter.js';

export interface BuildPruebaApiOptions {
  token?: string;
}

export const buildPruebaApi = ({ token }: BuildPruebaApiOptions = {}) =>
  new PruebaHttpAdapter({ token });
