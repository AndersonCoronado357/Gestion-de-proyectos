// Configuración del OAuth client de Google compartido por TODAS las
// APIs de Google del tester (Sheets hoy, Drive/Calendar/etc. después).
//
// El client_id es el MISMO del login con Google — están en el mismo
// proyecto de Cloud. El secret SÍ es diferente: el login usa GIS (sin
// secret, solo ID token) mientras que el tester intercambia un
// authorization code por refresh+access tokens y eso requiere secret.
//
// `redirect_uri = 'postmessage'` es el valor mágico de Google para el
// flow popup de `google.accounts.oauth2.initCodeClient` — no hay un
// redirect real, el code llega vía postMessage al frontend. Hay que
// pasarle exactamente ese string al `getToken()` del OAuth2Client.

const env = require('../../../../config/env');

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  // Scopes que el tester pide cuando el user conecta su cuenta. Si más
  // adelante se suma Calendar/Gmail/etc., se agregan acá.
  defaultScopes: string[];
  redirectUri: 'postmessage';
}

// Scopes — uno por cada API que tiene su propio módulo tester.
const SHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive';
const CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar';
// gmail.modify = leer + enviar + etiquetar (read+send+labels) sin
// llegar a gmail.full (que incluye permanente delete).
const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.modify';
const DOCS_SCOPE = 'https://www.googleapis.com/auth/documents';
const TASKS_SCOPE = 'https://www.googleapis.com/auth/tasks';
// Meet — spaces creados por la app. Otros scopes (recordings,
// transcripts) requieren Workspace y verificación adicional.
const MEET_SCOPE = 'https://www.googleapis.com/auth/meetings.space.created';

// Identidad del consentidor (para guardar `google_email`) — son los
// scopes "open id" estándar; no requieren verification.
const OPENID_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email'
];

export function getGoogleOAuthConfig(): GoogleOAuthConfig {
  return {
    clientId: String(env.googleClientId ?? ''),
    clientSecret: String(env.googleClientSecret ?? ''),
    defaultScopes: [
      ...OPENID_SCOPES,
      SHEETS_SCOPE,
      DRIVE_SCOPE,
      CALENDAR_SCOPE,
      GMAIL_SCOPE,
      DOCS_SCOPE,
      TASKS_SCOPE,
      MEET_SCOPE
    ],
    redirectUri: 'postmessage'
  };
}

export function isGoogleOAuthConfigured(): boolean {
  const c = getGoogleOAuthConfig();
  return Boolean(c.clientId && c.clientSecret);
}
