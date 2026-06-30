import { ModuloDemoHttpAdapter } from '../exit/modulo-demo.http.adapter.js';

export interface BuildModuloDemoApiOptions {
  token?: string;
}

export const buildModuloDemoApi = ({ token }: BuildModuloDemoApiOptions = {}) =>
  new ModuloDemoHttpAdapter({ token });
