import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../AuthContext.js';

// Recibe la redirección de Google (?code&state), valida el state, manda el
// code al backend (que lo intercambia por el id_token) e inicia sesión.
export default function GoogleCallbackPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;

    const code = params.get('code');
    const state = params.get('state');
    const saved = sessionStorage.getItem('google_oauth_state');
    sessionStorage.removeItem('google_oauth_state');

    if (params.get('error') || !code) {
      setError('No se pudo iniciar sesión con Google.');
      return;
    }
    if (!state || state !== saved) {
      setError('Estado de seguridad inválido. Intenta de nuevo.');
      return;
    }

    signInWithGoogle(code)
      .then(() => navigate('/', { replace: true }))
      .catch((e) =>
        setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión con Google.')
      );
  }, [params, signInWithGoogle, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-center">
      {error ? (
        <>
          <p className="text-[14px] text-danger-text">{error}</p>
          <a href="/login" className="text-[13px] text-accent underline">
            Volver al inicio de sesión
          </a>
        </>
      ) : (
        <p className="text-[14px] text-fg-muted">Iniciando sesión con Google…</p>
      )}
    </div>
  );
}
