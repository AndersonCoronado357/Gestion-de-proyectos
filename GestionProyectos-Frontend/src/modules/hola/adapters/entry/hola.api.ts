import { HolaHttpAdapter } from '../exit/hola.http.adapter.js';

export interface BuildHolaApiOptions {
  token?: string;
}

export const buildHolaApi = ({ token }: BuildHolaApiOptions = {}) =>
  new HolaHttpAdapter({ token });
