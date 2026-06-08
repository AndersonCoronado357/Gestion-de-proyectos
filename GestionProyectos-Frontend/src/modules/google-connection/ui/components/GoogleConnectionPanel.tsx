// Panel de conexión a Google reusable.  Cada tester de API de Google
// (Sheets, Drive, etc.) lo embebe arriba.  Dos variantes:
//   - 'empty':  CTA grande centrado, para cuando NO hay conexión.
//   - 'inline': link chico, para cuando ya está conectado y queremos
//     que no ocupe lugar (sólo se usa para desconectar).

import { useEffect } from 'react';
import Button from '../../../../shared/components/Button/index.js';
import { GoogleIcon } from '../../../../shared/icons/index.js';
import { useGoogleConnection } from '../hooks/useGoogleConnection.js';

export interface GoogleConnectionPanelProps {
  variant: 'empty' | 'inline';
  // Avisa al padre cuando cambia el estado de conexión — para que el
  // padre cambie de "empty state" a "tester" o al revés.
  onChange?: (connected: boolean) => void;
}

export default function GoogleConnectionPanel({
  variant,
  onChange
}: GoogleConnectionPanelProps) {
  const { status, loading, busy, connect, disconnect } = useGoogleConnection();

  useEffect(() => {
    if (status) onChange?.(status.connected);
  }, [status, onChange]);

  if (variant === 'empty') {
    if (loading) {
      return (
        <div className="flex flex-1 items-center justify-center text-[12px] text-fg-faint">
          Cargando…
        </div>
      );
    }
    if (status && !status.oauthConfigured) {
      return (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-[13px] font-semibold text-danger-text">
            Falta configuración en el backend
          </p>
          <p className="max-w-md text-[12px] text-fg-faint">
            La variable <code>GOOGLE_CLIENT_SECRET</code> no está seteada — no se puede iniciar el consent con Google.
          </p>
        </div>
      );
    }
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-bg-muted text-fg-muted">
          <GoogleIcon width={26} height={26} />
        </div>
        <div className="space-y-1">
          <p className="text-[15px] font-bold text-fg">
            Conectá tu cuenta de Google
          </p>
          <p className="max-w-md text-[12px] text-fg-faint">
            Necesitamos tu autorización para acceder a las APIs de Google. La conexión queda guardada — no te lo vamos a volver a pedir.
          </p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={busy}
          onClick={() => void connect()}
          leftIcon={<GoogleIcon width={14} height={14} />}
        >
          {busy ? 'Conectando…' : 'Conectar con Google'}
        </Button>
      </div>
    );
  }

  // inline
  if (loading || !status?.connected || !status.connection) return null;
  return (
    <button
      type="button"
      onClick={() => void disconnect()}
      disabled={busy}
      className="shrink-0 text-[11px] font-medium text-fg-faint outline-none transition-colors hover:text-danger-text disabled:opacity-50"
      title={
        status.connection.googleEmail
          ? `Conectado como ${status.connection.googleEmail}`
          : 'Desconectar Google'
      }
    >
      Desconectar Google
    </button>
  );
}
