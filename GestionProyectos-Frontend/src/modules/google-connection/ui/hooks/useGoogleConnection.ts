// Hook que centraliza el estado de conexión a Google: status,
// connect, disconnect.  Lo usa cualquier tester de API de Google
// (Sheets, Drive, etc.) — la conexión es ÚNICA por usuario y vale
// para todos.

import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../../../../shared/components/Toast/index.js';
import { env } from '../../../../config/env.js';
import { useAuth } from '../../../auth/ui/AuthContext.js';
import { appLog } from '../../../logs/logger.js';
import { googleConnectionHttp } from '../../adapters/exit/google-connection.http.adapter.js';
import type { GoogleConnectionStatus } from '../../domain/google-connection.types.js';
import { requestGoogleAuthCode } from '../../shared/oauth-popup.js';

export interface UseGoogleConnection {
  status: GoogleConnectionStatus | null;
  loading: boolean;
  busy: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
}

export function useGoogleConnection(): UseGoogleConnection {
  const toast = useToast();
  const { user } = useAuth();
  const [status, setStatus] = useState<GoogleConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const s = await googleConnectionHttp.getStatus();
      setStatus(s);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const connect = useCallback(async (): Promise<void> => {
    if (busy) return;
    if (!env.googleClientId) {
      toast.error({
        title: 'Falta configuración',
        message: 'No hay VITE_GOOGLE_CLIENT_ID en el frontend.'
      });
      return;
    }
    setBusy(true);
    try {
      const code = await requestGoogleAuthCode(env.googleClientId, user?.email);
      const result = await googleConnectionHttp.connect(code);
      if (result?.connected) {
        await refresh();
        toast.success({
          title: 'Cuenta de Google conectada',
          message: result.connection.googleEmail ?? ''
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Inténtalo de nuevo.';
      toast.error({ title: 'No se pudo conectar Google', message: msg });
      appLog.error(`No se pudo conectar Google: ${msg}`, {
        category: 'app',
        loggerName: 'useGoogleConnection.connect',
        stackTrace: e instanceof Error ? e.stack ?? null : null
      });
    } finally {
      setBusy(false);
    }
  }, [busy, refresh, toast, user?.email]);

  const disconnect = useCallback(async (): Promise<void> => {
    if (busy) return;
    if (!window.confirm('¿Desconectar tu cuenta de Google?')) return;
    setBusy(true);
    try {
      await googleConnectionHttp.disconnect();
      await refresh();
      toast.success({ title: 'Google desconectado' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Inténtalo de nuevo.';
      toast.error({ title: 'No se pudo desconectar', message: msg });
    } finally {
      setBusy(false);
    }
  }, [busy, refresh, toast]);

  return { status, loading, busy, connect, disconnect };
}
