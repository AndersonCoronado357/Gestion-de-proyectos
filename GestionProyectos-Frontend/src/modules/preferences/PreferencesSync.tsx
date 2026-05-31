// Persiste cambios de tema y resetea a defaults al cerrar sesión.
//
// La HIDRATACIÓN inicial (aplicar las preferencias del servidor al entrar)
// la hace el AuthContext con los datos que vienen en /auth/login y
// /auth/me — así el tema queda listo antes de que React pinte el
// dashboard y no hay flash.
//
// Aquí sólo:
//   - Si cambian los valores del ThemeContext y hay usuario logueado →
//     PUT /me/preferences (debounced 600ms).
//   - Si el usuario se desautentica → reset a defaults para que /login no
//     muestre los colores del usuario anterior.

import { useEffect, useRef } from 'react';
import { useTheme } from '../../shared/theme/ThemeContext.js';
import { useAuth } from '../auth/ui/AuthContext.js';
import {
  updatePreferences,
  type RemoteUiPreferences
} from './api.js';

const DEBOUNCE_MS = 600;

export function PreferencesSync() {
  const { user } = useAuth();
  const { mode, accentHex, fontFamily, fontSize, resetToDefaults } = useTheme();

  // Marcadores para distinguir "lo aplicó el AuthContext" vs "el usuario
  // tocó algo en Configuración".
  //
  // Cuando aparece un user, los valores actuales (ya aplicados por
  // AuthContext) son la "verdad del servidor" → no los volvemos a mandar.
  // Sólo después de ese primer tick comparamos y, si cambia algo, hacemos
  // PUT.
  const baselineUserId = useRef<number | null>(null);
  const saveTimer = useRef<number | null>(null);

  // (1) Reset al cerrar sesión.
  useEffect(() => {
    if (!user && baselineUserId.current !== null) {
      baselineUserId.current = null;
      resetToDefaults();
    }
  }, [user, resetToDefaults]);

  // (2) Captura el "baseline" cuando aparece un usuario.
  useEffect(() => {
    if (user && baselineUserId.current !== user.id) {
      baselineUserId.current = user.id;
    }
  }, [user]);

  // (3) Persistencia debounced. Se dispara cuando ya hay baseline y los
  // valores cambian con respecto a lo último persistido.
  const lastSaved = useRef<RemoteUiPreferences | null>(null);
  useEffect(() => {
    if (!user) return;
    if (baselineUserId.current !== user.id) return;

    const current: RemoteUiPreferences = { mode, accentHex, fontFamily, fontSize };

    // Si es el primer tick para este usuario, el "valor actual" es lo que
    // ya vino del server vía AuthContext → no lo mandamos de vuelta.
    if (lastSaved.current === null) {
      lastSaved.current = current;
      return;
    }
    if (
      lastSaved.current.mode === current.mode &&
      lastSaved.current.accentHex === current.accentHex &&
      lastSaved.current.fontFamily === current.fontFamily &&
      lastSaved.current.fontSize === current.fontSize
    ) {
      return;
    }

    if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      updatePreferences(current)
        .then(() => {
          lastSaved.current = current;
        })
        .catch(() => {
          // Silencioso. La próxima sesión leerá lo último que sí persistió.
        });
    }, DEBOUNCE_MS);

    return () => {
      if (saveTimer.current !== null) window.clearTimeout(saveTimer.current);
    };
  }, [user, mode, accentHex, fontFamily, fontSize]);

  // (4) Cuando el usuario se va, reseteamos el "lastSaved" para que el
  // próximo login arranque limpio.
  useEffect(() => {
    if (!user) lastSaved.current = null;
  }, [user]);

  return null;
}
