// Wrapper del OAuth2Client de `googleapis` — separa el "intercambio de
// code por tokens" y el "refresh de access token" del resto de la app,
// así si Google cambia el SDK no rompe nada más.

import { OAuth2Client } from 'google-auth-library';
import { getGoogleOAuthConfig } from '../../config/oauth.config';

export interface ExchangeCodeResult {
  // Refresh token (lo guardamos cifrado en la BD).
  refreshToken: string;
  // Access token de corta vida (~1h) — se usa para la PRIMERA llamada
  // y se descarta; las siguientes lo refrescan desde el repo.
  accessToken: string;
  expiresAt: Date;
  // Scopes que Google CONCEDIÓ (puede ser un subset de los pedidos si
  // el user des-tildó alguno).
  scopes: string[];
  // Email de la cuenta — lo sacamos del id_token o de userinfo.
  googleEmail: string | null;
}

export interface RefreshResult {
  accessToken: string;
  expiresAt: Date;
}

function buildClient(): OAuth2Client {
  const cfg = getGoogleOAuthConfig();
  return new OAuth2Client({
    clientId: cfg.clientId,
    clientSecret: cfg.clientSecret,
    redirectUri: cfg.redirectUri
  });
}

// Intercambia el authorization code que llegó del consent popup por
// access+refresh tokens. Sólo se llama UNA vez por conexión (en
// connect).
export async function exchangeCode(code: string): Promise<ExchangeCodeResult> {
  const client = buildClient();
  const { tokens } = await client.getToken(code);
  const refresh = tokens.refresh_token;
  if (!refresh) {
    // Google sólo devuelve refresh token la PRIMERA vez que el user
    // consiente para este client_id; reconectar puede no traer uno
    // nuevo si el user no fuerza re-consent. El frontend pasa
    // `prompt: 'consent'` en initCodeClient para garantizar uno fresco.
    throw new Error(
      'Google no devolvió refresh token — el frontend debe pedir consent con prompt=consent'
    );
  }
  const access = tokens.access_token;
  if (!access) throw new Error('Google no devolvió access token');
  const expiry = tokens.expiry_date
    ? new Date(tokens.expiry_date)
    : new Date(Date.now() + 60 * 60 * 1000);
  const scopes = (tokens.scope ?? '').split(' ').filter(Boolean);

  // El id_token (JWT) trae el email — lo decodificamos sin verificar
  // firma (no es un token de auth nuestro, sólo info de identidad para
  // mostrar en UI).
  let googleEmail: string | null = null;
  if (tokens.id_token) {
    const payload = decodeJwtPayload(tokens.id_token);
    if (payload && typeof payload.email === 'string') {
      googleEmail = payload.email;
    }
  }

  return {
    refreshToken: refresh,
    accessToken: access,
    expiresAt: expiry,
    scopes,
    googleEmail
  };
}

// Toma el refresh y pide un nuevo access. Lo llama el resolver cada
// vez que un endpoint necesita un access fresco.
export async function refreshAccessToken(
  refreshToken: string
): Promise<RefreshResult> {
  const client = buildClient();
  client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await client.refreshAccessToken();
  const access = credentials.access_token;
  if (!access) throw new Error('Google no devolvió access al refrescar');
  const expiry = credentials.expiry_date
    ? new Date(credentials.expiry_date)
    : new Date(Date.now() + 60 * 60 * 1000);
  return { accessToken: access, expiresAt: expiry };
}

function decodeJwtPayload(jwt: string): Record<string, unknown> | null {
  const parts = jwt.split('.');
  if (parts.length !== 3) return null;
  try {
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '==='.slice((b64.length + 3) % 4);
    const json = Buffer.from(padded, 'base64').toString('utf8');
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}
