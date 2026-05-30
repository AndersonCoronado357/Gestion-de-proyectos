// Cliente HTTP central de la app.
//
// Características:
//   - `credentials: 'include'` para que el navegador mande la cookie del
//     refresh token automáticamente.
//   - Inyección perezosa del access token (vía `getAccessToken`) — así el
//     AuthContext puede decidir qué token enviar sin acoplar el http a él.
//
// Auth proactivo + reactivo:
//   1. PROACTIVO: si la request necesita auth y no hay access token (caso
//      típico tras un reload — el token vive sólo en memoria, así que se
//      pierde y debe refrescarse), pedimos el refresh ANTES de mandar.
//      Esto evita el chorro de 401 ruidosos en consola al recargar la app.
//   2. REACTIVO: si igual sale 401 (token expiró mid-sesión), llamamos al
//      refresh y reintentamos una vez.
//
// Ambos pasos comparten `onUnauthorized()` — el AuthContext lo dedupea
// internamente con un `refreshInFlight`, así múltiples requests al mismo
// tiempo disparan UN solo refresh y todas reusan el mismo token.

import { env } from '../../config/env.js';

export interface HttpOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  token?: string;
  headers?: Record<string, string>;
  // Si es true, NO intenta refresh ni proactivo ni reactivo.  Lo usan
  // los endpoints de /auth/* que ya están en el flow de auth.
  skipAuthRefresh?: boolean;
}

export class HttpError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.data = data;
  }
}

// Hooks inyectables — el AuthContext los registra al montar.
let accessTokenGetter: (() => string | null) = () => null;
let onUnauthorized: (() => Promise<string | null>) | null = null;

export function setAccessTokenGetter(getter: () => string | null): void {
  accessTokenGetter = getter;
}

export function setUnauthorizedHandler(
  handler: (() => Promise<string | null>) | null
): void {
  onUnauthorized = handler;
}

async function doFetch(
  path: string,
  opts: HttpOptions,
  accessToken: string | null
): Promise<Response> {
  const { method = 'GET', body, headers = {} } = opts;
  return fetch(`${env.apiBaseUrl}${path}`, {
    method,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
}

async function parseResponse(res: Response): Promise<unknown> {
  const text = await res.text();
  return text ? (JSON.parse(text) as unknown) : null;
}

function extractMessage(data: unknown, fallback: string): string {
  if (data && typeof data === 'object' && 'message' in data) {
    const m = (data as { message: unknown }).message;
    if (typeof m === 'string') return m;
  }
  return fallback;
}

// Endpoints que NO entran al ciclo de refresh (los del propio módulo
// auth los maneja el AuthContext explícitamente).
function isAuthEndpoint(path: string): boolean {
  return (
    path.startsWith('/auth/login') ||
    path.startsWith('/auth/refresh') ||
    path.startsWith('/auth/logout')
  );
}

export async function http<T = unknown>(
  path: string,
  options: HttpOptions = {}
): Promise<T | null> {
  const needsAuth = !options.skipAuthRefresh && !isAuthEndpoint(path);

  // 1) PROACTIVO: si no tenemos token y este endpoint requiere auth,
  //    pedimos refresh antes de la primera request.  Esto evita el
  //    chorro de 401s al recargar la app (los componentes hidratados
  //    desde cache disparan fetches antes de que el bootstrap del
  //    AuthContext termine el refresh).
  let accessToken: string | null = options.token ?? accessTokenGetter();
  if (!accessToken && needsAuth && onUnauthorized) {
    accessToken = await onUnauthorized();
  }

  let res = await doFetch(path, options, accessToken);

  // 2) REACTIVO: si igual sale 401, intentamos refrescar UNA vez y
  //    reintentamos.  Cubre el caso de un access token que caducó
  //    mientras la request estaba en vuelo o entre renders.
  if (res.status === 401 && needsAuth && onUnauthorized) {
    const newToken = await onUnauthorized();
    if (newToken) {
      res = await doFetch(path, options, newToken);
    }
  }

  const data = await parseResponse(res);
  if (!res.ok) {
    throw new HttpError(extractMessage(data, res.statusText), res.status, data);
  }
  return data as T | null;
}
