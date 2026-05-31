import { AuthHttpAdapter } from '../exit/auth.http.adapter';

export const buildAuthApi = () => new AuthHttpAdapter();
