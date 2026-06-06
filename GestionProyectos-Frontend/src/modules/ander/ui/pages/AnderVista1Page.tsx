// Auto-generado a partir de la vista "Vista 1" (id=30).
// Se sobrescribe al volver a publicar — no editar a mano.

import Button from '../../../../shared/components/Button/index.js';
import LevelChip from '../../../../shared/components/LevelChip/index.js';
import Select from '../../../../shared/components/Select/index.js';
import { useEffect, useRef, useState } from 'react';

const DESIGN_W = 1600;
const DESIGN_H = 900;

export default function AnderVista1Page() {
  // Scale por ANCHO: el canvas ocupa el 100% del ancho disponible.
  // Si el alto escalado excede el viewport, scroll vertical natural.
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = (): void => {
      const r = el.getBoundingClientRect();
      if (r.width === 0) return;
      setScale(r.width / DESIGN_W);
    };
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} className="relative h-full w-full overflow-x-hidden overflow-y-auto">
      <div style={{ width: '100%', height: DESIGN_H * scale, overflow: 'hidden' }}>
        <div
          style={{
            position: 'relative',
            width: DESIGN_W,
            height: DESIGN_H,
            transform: `scale(${scale})`,
            transformOrigin: 'top left'
          }}
        >
        <div key="c6a19b45-39e5-4bfb-990d-7caaace64b66" style={{ position: 'absolute' as const, left: 24, top: 24, width: 1552, height: 148 }}><div className="h-full w-full bg-bg shadow-sm rounded-md" /></div>
        <div key="863b8d2e-9a70-48e8-a8ff-3c9d59912095" style={{ position: 'absolute' as const, left: 24, top: 203, width: 360, height: 673 }}><div className="h-full w-full bg-bg shadow-sm rounded-md" /></div>
        <div key="6257060f-32ef-49eb-aab2-6414c18ec2b7" style={{ position: 'absolute' as const, left: 412, top: 203, width: 1164, height: 200 }}><div className="h-full w-full bg-bg shadow-sm rounded-md" /></div>
        <div key="3d6628b1-0abe-4045-be65-4770b9f0bba1" style={{ position: 'absolute' as const, left: 412, top: 428, width: 1164, height: 448 }}><div className="h-full w-full bg-bg shadow-sm rounded-md" /></div>
        <div key="e5c59063-959e-4374-b7a3-009309776c5f" style={{ position: 'absolute' as const, left: 52, top: 54, width: 120, height: 32 }}><Button type="button" variant="danger" size="sm" fullWidth>Botón</Button></div>
        <div className="flex h-full w-full flex-col justify-start" key="903e57b2-fa70-477d-937b-c7b31fe19506" style={{ position: 'absolute' as const, left: 1298, top: 54, width: 260, height: 38 }}><Select options={[]} value={null} onChange={() => {}} /></div>
        <div className="flex h-full w-full items-center" key="6c3b6d56-058d-4cd5-9e41-eafd666451d4" style={{ position: 'absolute' as const, left: 580, top: 281, width: 90, height: 22 }}><LevelChip level="success" /></div>
        </div>
      </div>
    </div>
  );
}
