import { ModuleXHttpAdapter } from '../exit/module-x.http.adapter.js';

export interface BuildModuleXApiOptions {
  token?: string;
}

export const buildModuleXApi = ({ token }: BuildModuleXApiOptions = {}) =>
  new ModuleXHttpAdapter({ token });
