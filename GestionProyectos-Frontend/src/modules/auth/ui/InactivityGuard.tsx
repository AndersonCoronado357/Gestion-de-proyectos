// Heartbeat de actividad.  No cierra sesión — sólo pinguea al backend
// para mantener `users.last_activity_at` fresco mientras el usuario
// está USANDO la app.  Si se queda quieto, no hay más pings y la
// columna queda con su último timestamp; cualquier consulta deriva el
// estado (online/away) comparando ese timestamp contra el now.
//
// Reglas:
//   - Cada evento de input (mousemove, click, keydown, scroll, touch)
//     marca `lastInput = now`.  Si pasaron ≥ 60s desde el último ping,
//     se manda uno y se actualiza `lastPing`.
//   - Un interval de 30s sirve de failsafe SÓLO si hubo input nuevo
//     desde el último ping y el throttle ya venció.  Sin input nuevo
//     no se pinguea — esa era la causa del bug "Última actividad: hace
//     un momento" que no avanzaba aunque el usuario estuviera quieto.

import { useEffect, useRef } from 'react';
import { http } from '../../../shared/utils/http.js';
import { useAuth } from './AuthContext.js';

const ACTIVITY_EVENTS: Array<keyof DocumentEventMap> = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart'
];

// Cada cuánto, como mucho, mandamos un ping (throttle).  Los eventos
// de input disparan el ping en tiempo real (con este intervalo
// mínimo).  Si el usuario deja de moverse, no hay más pings — el
// `last_activity_at` queda con su último valor y "envejece" solo en
// la DB (cualquier consulta que quiera saber si está activo lo deriva
// comparando contra el now).
const PING_THROTTLE_MS = 60 * 1000;

async function ping(): Promise<void> {
  try {
    await http('/me/activity', { method: 'POST' });
  } catch {
    // Silencioso — un heartbeat fallido no debe interrumpir la sesión.
  }
}

export function InactivityGuard() {
  const { user } = useAuth();

  // Último timestamp en que mandamos un ping.
  const lastPingAtRef = useRef<number>(0);
  // Último input detectado.
  const lastInputAtRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!user) return;

    // Disparo inicial: al montar (login), marcamos actividad inmediato.
    lastInputAtRef.current = Date.now();
    lastPingAtRef.current = Date.now();
    void ping();

    const handleInput = () => {
      const now = Date.now();
      lastInputAtRef.current = now;
      // Si ya pasó el throttle, mandamos.
      if (now - lastPingAtRef.current >= PING_THROTTLE_MS) {
        lastPingAtRef.current = now;
        void ping();
      }
    };

    ACTIVITY_EVENTS.forEach((evt) => {
      document.addEventListener(evt, handleInput, { passive: true });
    });

    // Failsafe: cada 30s revisamos si hubo INPUT desde el último ping y
    // si el throttle ya venció.  Sólo entonces mandamos — sin esto, el
    // interval pingueaba aunque el usuario no estuviera tocando nada y
    // su `last_activity_at` seguía "fresco" indefinidamente.  El último
    // chequeo (idleFor > STOP) era una salvaguarda contra eso, pero
    // recién paraba a los 10 min.  Lo correcto: el failsafe sólo dispara
    // cuando hubo input que el throttle se comió.
    const interval = window.setInterval(() => {
      const now = Date.now();
      const inputSinceLastPing = lastInputAtRef.current > lastPingAtRef.current;
      if (!inputSinceLastPing) return;
      if (now - lastPingAtRef.current >= PING_THROTTLE_MS) {
        lastPingAtRef.current = now;
        void ping();
      }
    }, 30 * 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => {
        document.removeEventListener(evt, handleInput);
      });
      window.clearInterval(interval);
    };
  }, [user]);

  return null;
}
