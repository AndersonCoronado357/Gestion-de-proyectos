import { useEffect, type RefObject } from 'react';

/**
 * Cierra un popup/dropdown cuando el usuario hace scroll en cualquier
 * contenedor que NO sea el propio popup. Los popups usan `position: fixed`
 * y se posicionan según el bounding rect del anchor — al hacer scroll el
 * anchor se mueve pero el popup queda flotando, generando el efecto raro
 * de que el dropdown "acompaña" la página.
 *
 * Pasa los refs de los nodos que SÍ deben permitir scroll interno sin
 * cerrar (el propio popup, normalmente). Cualquier otro scroll cierra.
 */
export function useCloseOnScroll(
  open: boolean,
  onClose: () => void,
  allowRefs: ReadonlyArray<RefObject<HTMLElement | null>> = []
): void {
  useEffect(() => {
    if (!open) return;
    const onScroll = (e: Event) => {
      const t = e.target as Node | null;
      for (const ref of allowRefs) {
        const node = ref?.current;
        if (node && t && (node === t || node.contains(t))) return;
      }
      onClose();
    };
    // capture: true para captar scrolls de cualquier ancestro scrollable
    // (main, modals, panels, etc.), no sólo window.
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
}
