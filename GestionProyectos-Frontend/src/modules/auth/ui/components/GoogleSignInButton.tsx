import { useState } from 'react';
import { env } from '../../../../config/env.js';
import { GoogleIcon } from '../../../../shared/icons/index.js';
import SocialButton from './SocialButton.js';

// Login con Google por REDIRECCIÓN (igual que el resto de apps de acmsy):
// mandamos al usuario a Google con el client compartido de acmsy y el
// redirect_uri del callback. Google vuelve a /auth/callback con un `code`
// que GoogleCallbackPage intercambia en el backend.
function buildGoogleAuthUrl(): string {
  const state =
    (typeof crypto !== 'undefined' && crypto.randomUUID && crypto.randomUUID()) ||
    Math.random().toString(36).slice(2);
  sessionStorage.setItem('google_oauth_state', state);
  const params = new URLSearchParams({
    client_id: env.googleClientId,
    redirect_uri: env.googleRedirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
    access_type: 'online'
  });
  return 'https://accounts.google.com/o/oauth2/v2/auth?' + params.toString();
}

export default function GoogleSignInButton() {
  const [error, setError] = useState<string | null>(null);
  const clientId = env.googleClientId;

  const onClick = () => {
    if (!clientId) {
      setError('Configura VITE_GOOGLE_CLIENT_ID para habilitar Google.');
      return;
    }
    window.location.href = buildGoogleAuthUrl();
  };

  return (
    <div>
      <SocialButton
        icon={<GoogleIcon />}
        className="h-10 text-[13px]"
        onClick={onClick}
        title={clientId ? 'Continuar con Google' : 'Falta configurar el Client ID de Google'}
      >
        Continuar con Google
      </SocialButton>
      {error && <p className="mt-2 text-center text-[12px] text-danger-text">{error}</p>}
    </div>
  );
}
