// Helper para pedirle a Google un authorization code con el popup flow
// de `google.accounts.oauth2.initCodeClient`.
//
// El popup abre el consent screen de Google, el user acepta y Google
// devuelve un code (NO un token). Ese code lo mandamos al backend que
// lo intercambia por access+refresh tokens — los tokens nunca tocan el
// frontend, así no quedan accesibles a XSS.

const GSI_SRC = 'https://accounts.google.com/gsi/client';

// Scopes que necesita el tester para TODAS las APIs de Google que
// expone la app (Sheets, Drive, Calendar, Gmail, Docs, Tasks, Meet).
// Identidad (openid+email) viene gratis y la usamos para guardar el
// email del consentidor. Tiene que coincidir con `defaultScopes` del
// backend (src/external-apis/google/_shared/config/oauth.config.ts).
const REQUIRED_SCOPES = [
  'openid',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/meetings.space.created'
].join(' ');

interface CodeClient {
  requestCode: () => void;
}

interface OAuth2Module {
  initCodeClient: (cfg: {
    client_id: string;
    scope: string;
    ux_mode: 'popup';
    prompt?: 'consent' | 'none' | '';
    hint?: string;
    callback: (resp: { code?: string; error?: string }) => void;
    error_callback?: (err: { type?: string; message?: string }) => void;
  }) => CodeClient;
}

// El tipo de `window.google` ya está declarado en GoogleSignInButton.tsx
// con la rama `accounts.id`. Acá no podemos redeclararlo con la rama
// `oauth2`; accedemos con cast puntual.
function getOauth2(): OAuth2Module | undefined {
  const w = window as unknown as {
    google?: { accounts?: { oauth2?: OAuth2Module } };
  };
  return w.google?.accounts?.oauth2;
}

async function loadGsi(): Promise<void> {
  if (getOauth2()) return;
  await new Promise<void>((resolve, reject) => {
    let script = document.getElementById('gsi-script') as HTMLScriptElement | null;
    if (script && getOauth2()) {
      resolve();
      return;
    }
    if (!script) {
      script = document.createElement('script');
      script.id = 'gsi-script';
      script.src = GSI_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
    const onLoad = (): void => {
      script?.removeEventListener('load', onLoad);
      if (getOauth2()) resolve();
      else reject(new Error('GSI cargó pero oauth2 no está disponible'));
    };
    const onErr = (): void => {
      script?.removeEventListener('error', onErr);
      reject(new Error('No se pudo cargar Google Identity Services.'));
    };
    script.addEventListener('load', onLoad);
    script.addEventListener('error', onErr);
  });
}

export async function requestGoogleAuthCode(
  clientId: string,
  loginHint?: string
): Promise<string> {
  if (!clientId) throw new Error('Falta VITE_GOOGLE_CLIENT_ID.');
  await loadGsi();
  const oauth2 = getOauth2();
  if (!oauth2) throw new Error('Google OAuth2 no está disponible.');

  return new Promise<string>((resolve, reject) => {
    const client = oauth2.initCodeClient({
      client_id: clientId,
      scope: REQUIRED_SCOPES,
      ux_mode: 'popup',
      // `prompt: 'consent'` GARANTIZA que Google devuelva refresh token.
      prompt: 'consent',
      ...(loginHint ? { hint: loginHint } : {}),
      callback: (resp) => {
        if (resp.code) resolve(resp.code);
        else reject(new Error(resp.error || 'No se recibió código de Google.'));
      },
      error_callback: (err) => {
        reject(new Error(err.message || 'El consent fue cancelado.'));
      }
    });
    client.requestCode();
  });
}
