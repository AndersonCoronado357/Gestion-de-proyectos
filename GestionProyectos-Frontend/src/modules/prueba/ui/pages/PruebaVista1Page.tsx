// Auto-generado a partir de la vista "Vista 1" (id=32).
// Se sobrescribe al volver a publicar — no editar a mano.

import { useEffect, useRef, useState } from 'react';

const DESIGN_W = 1600;
const DESIGN_H = 900;

export default function PruebaVista1Page() {
  // Ancho con porcentajes en cada bloque; alto con `sy` (nunca
  // agranda, solo achica si viewport_h < DESIGN_H). Sin transform
  // porque rompe el dropdown de los Select, los Portals y hovers.
  const ref = useRef<HTMLDivElement>(null);
  const [sy, setSy] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = (): void => {
      const r = el.getBoundingClientRect();
      if (r.height === 0) return;
      setSy(r.height >= DESIGN_H ? 1 : r.height / DESIGN_H);
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className="relative h-full w-full overflow-hidden">
      <div style={{ position: 'relative', width: '100%', height: DESIGN_H * sy }}>
        {/* sin componentes */}
      </div>
    </div>
  );
}
