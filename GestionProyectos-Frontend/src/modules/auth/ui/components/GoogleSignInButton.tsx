import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.js';
import { env } from '../../../../config/env.js';
import { GoogleIcon } from '../../../../shared/components/icons/index.js';
import SocialButton from './SocialButton.js';
import { cn } from '../../../../shared/lib/cn.js';

// Tipado mínimo de Google Identity Services.
declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (cfg: {
            client_id: string;
            callback: (resp: { credential?: string }) => void;
          }) => void;
          renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const GSI_SRC = 'https://accounts.google.com/gsi/client';

export default function GoogleSignInButton() {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const clientId = env.googleClientId;

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    const init = () => {
      const id = window.google?.accounts?.id;
      if (!id || !ref.current || cancelled) return;
      id.initialize({
        client_id: clientId,
        callback: async (resp) => {
          if (!resp.credential) return;
          try {
            await signInWithGoogle(resp.credential);
            navigate('/', { replace: true });
          } catch (e) {
            setError(
              e instanceof Error ? e.message : 'No se pudo iniciar sesión con Google'
            );
          }
        }
      });
      ref.current.innerHTML = '';
      id.renderButton(ref.current, {
        theme: 'outline',
        size: 'large',
        width: 320,
        text: 'continue_with',
        locale: 'es'
      });
    };

    // Carga GSI dinámicamente (no en index.html → no bloquea el load inicial).
    if (window.google?.accounts?.id) {
      init();
      return () => {
        cancelled = true;
      };
    }
    let script = document.getElementById('gsi-script') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.id = 'gsi-script';
      script.src = GSI_SRC;
      script.async = true;
      script.onerror = () => setError('No se pudo cargar Google Identity Services.');
      document.head.appendChild(script);
    }
    script.addEventListener('load', init);
    return () => {
      cancelled = true;
      script?.removeEventListener('load', init);
    };
  }, [clientId, signInWithGoogle, navigate]);

  // Sin Client ID → botón visual con aviso (la app no rompe).
  if (!clientId) {
    return (
      <SocialButton
        icon={<GoogleIcon />}
        className="h-10 text-[12.5px]"
        title="Falta configurar el Client ID de Google"
        onClick={() =>
          setError(
            'Configura VITE_GOOGLE_CLIENT_ID (frontend) y GOOGLE_CLIENT_ID (backend) para habilitar Google.'
          )
        }
      >
        {error ?? 'Google'}
      </SocialButton>
    );
  }

  // Nuestro botón (sin bordes, con hover). El botón real de Google se monta
  // ENCIMA, transparente (opacity-0), para conservar su flujo de clic/popup.
  return (
    <div>
      <div className="group relative">
        <div
          aria-hidden="true"
          className={cn(
            'pointer-events-none flex h-10 w-full items-center justify-center gap-2.5 rounded-lg',
            'bg-bg-muted text-[13px] font-medium text-fg shadow-sm',
            'transition-all duration-150 group-hover:shadow-md group-hover:brightness-95 group-active:scale-[0.99]'
          )}
        >
          <GoogleIcon />
          <span>Continuar con Google</span>
        </div>
        <div
          ref={ref}
          aria-label="Continuar con Google"
          className="absolute inset-0 z-10 overflow-hidden opacity-0"
        />
      </div>
      {error && <p className="mt-2 text-center text-[12px] text-red-600">{error}</p>}
    </div>
  );
}
