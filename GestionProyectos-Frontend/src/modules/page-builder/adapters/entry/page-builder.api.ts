import { PageBuilderHttpAdapter } from '../exit/page-builder.http.adapter.js';

export interface BuildPageBuilderApiOptions {
  token?: string;
}

export const buildPageBuilderApi = ({ token }: BuildPageBuilderApiOptions = {}) =>
  new PageBuilderHttpAdapter({ token });
