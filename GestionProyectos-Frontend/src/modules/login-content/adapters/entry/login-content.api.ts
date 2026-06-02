import { LoginContentHttpAdapter } from '../exit/login-content.http.adapter.js';

export interface BuildLoginContentApiOptions {
  token?: string;
}

export const buildLoginContentApi = ({ token }: BuildLoginContentApiOptions = {}) =>
  new LoginContentHttpAdapter({ token });
