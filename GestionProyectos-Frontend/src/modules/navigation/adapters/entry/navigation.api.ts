import { NavigationHttpAdapter } from '../exit/navigation.http.adapter.js';

export interface BuildNavigationApiOptions {
  token?: string;
}

export const buildNavigationApi = ({ token }: BuildNavigationApiOptions = {}) =>
  new NavigationHttpAdapter({ token });
