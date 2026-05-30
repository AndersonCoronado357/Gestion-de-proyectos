// Detecta inactividad del usuario y dispara un callback cuando se supera
// el umbral.  "Actividad" = mousemove, mousedown, keydown, scroll, touchstart.
//
// El timer se reinicia en cada actividad, así que sólo cuenta los segundos
// sin interacción real.

import { useEffect, useRef } from 'react';

const ACTIVITY_EVENTS: Array<keyof DocumentEventMap> = [
  'mousemove',
  'mousedown',
  'keydown',
  'scroll',
  'touchstart'
];

export interface InactivityOptions {
  // ms hasta considerar al usuario "inactivo". Default: 10 min.
  timeoutMs?: number;
  // true para apagar el hook (e.g. cuando no hay usuario logueado).
  disabled?: boolean;
}

export function useInactivityTimeout(
  onTimeout: () => void,
  { timeoutMs = 10 * 60 * 1000, disabled = false }: InactivityOptions = {}
): void {
  const callbackRef = useRef(onTimeout);
  callbackRef.current = onTimeout;

  useEffect(() => {
    if (disabled) return;

    let timer = window.setTimeout(() => callbackRef.current(), timeoutMs);

    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => callbackRef.current(), timeoutMs);
    };

    // `passive: true` evita warnings de scroll en mobile.
    ACTIVITY_EVENTS.forEach((evt) => {
      document.addEventListener(evt, reset, { passive: true });
    });

    return () => {
      window.clearTimeout(timer);
      ACTIVITY_EVENTS.forEach((evt) => {
        document.removeEventListener(evt, reset);
      });
    };
  }, [timeoutMs, disabled]);
}
