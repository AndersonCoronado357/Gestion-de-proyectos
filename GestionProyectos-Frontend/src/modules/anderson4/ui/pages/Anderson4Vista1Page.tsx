// Auto-generado a partir de la vista "Vista 1" (id=30).
// Se sobrescribe al volver a publicar — no editar a mano.

import Button from '../../../../shared/components/Button/index.js';
import LevelChip from '../../../../shared/components/LevelChip/index.js';
import Select from '../../../../shared/components/Select/index.js';
import { useEffect, useRef, useState } from 'react';

const DESIGN_W = 1600;
const DESIGN_H = 900;

function _S0() {
  const [v, setV] = useState<string | null>(null);
  return <Select options={[{"value":"a","label":"a"},{"value":"b","label":"b"},{"value":"c","label":"c"}]} value={v} onChange={setV} />;
}

export default function Anderson4Vista1Page() {
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
        <div key="c6a19b45-39e5-4bfb-990d-7caaace64b66" style={{ position: 'absolute' as const, left: `1.5000%`, top: 24 * sy, width: `97.0000%`, height: 148 * sy }}><div className="h-full w-full bg-bg shadow-sm rounded-md" /></div>
        <div key="863b8d2e-9a70-48e8-a8ff-3c9d59912095" style={{ position: 'absolute' as const, left: `1.5000%`, top: 203 * sy, width: `22.5000%`, height: 673 * sy }}><div className="h-full w-full bg-bg shadow-sm rounded-md" /></div>
        <div key="6257060f-32ef-49eb-aab2-6414c18ec2b7" style={{ position: 'absolute' as const, left: `25.7500%`, top: 203 * sy, width: `72.7500%`, height: 200 * sy }}><div className="h-full w-full bg-bg shadow-sm rounded-md" /></div>
        <div key="3d6628b1-0abe-4045-be65-4770b9f0bba1" style={{ position: 'absolute' as const, left: `25.7500%`, top: 428 * sy, width: `72.7500%`, height: 448 * sy }}><div className="h-full w-full bg-bg shadow-sm rounded-md" /></div>
        <div key="e5c59063-959e-4374-b7a3-009309776c5f" style={{ position: 'absolute' as const, left: `3.2500%`, top: 54 * sy, width: `7.5000%`, height: 32 * sy }}><Button type="button" variant="danger" size="sm" fullWidth>Botón</Button></div>
        <div className="flex h-full w-full flex-col justify-start" key="903e57b2-fa70-477d-937b-c7b31fe19506" style={{ position: 'absolute' as const, left: `81.1250%`, top: 54 * sy, width: `16.2500%`, height: 38 * sy }}><_S0 /></div>
        <div className="flex h-full w-full items-center" key="6c3b6d56-058d-4cd5-9e41-eafd666451d4" style={{ position: 'absolute' as const, left: `36.2500%`, top: 281 * sy, width: `5.6250%`, height: 22 * sy }}><LevelChip level="success" /></div>
      </div>
    </div>
  );
}
