import { ComponentsHttpAdapter } from '../exit/components.http.adapter.js';

export interface BuildComponentsApiOptions {
  token?: string;
}

export const buildComponentsApi = ({ token }: BuildComponentsApiOptions = {}) =>
  new ComponentsHttpAdapter({ token });
