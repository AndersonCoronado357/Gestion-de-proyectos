// Auto-generado a partir de la vista "Vista 1" (id=33).
// Se sobrescribe al volver a publicar — no editar a mano.

import Accordion from '../../../../shared/components/Accordion/index.js';
import Button from '../../../../shared/components/Button/index.js';
import DataTable from '../../../../shared/components/DataTable/index.js';
import Input from '../../../../shared/components/Input/index.js';
import Select from '../../../../shared/components/Select/index.js';
import Stepper from '../../../../shared/components/Stepper/index.js';
import Switch from '../../../../shared/components/Switch/index.js';
import Tabs from '../../../../shared/components/Tabs/index.js';
import Textarea from '../../../../shared/components/Textarea/index.js';
import { useEffect, useRef, useState } from 'react';

const DESIGN_W = 1600;
const DESIGN_H = 900;

function _Sw0() {
  const [v, setV] = useState<string>("Sí");
  return <Switch options={[{"value":"Sí","label":"Sí"},{"value":"No","label":"No"}]} value={v} onChange={setV} />;
}
function _S1() {
  const [v, setV] = useState<string | null>(null);
  return <Select options={[]} value={v} onChange={setV} />;
}

export default function TryVista1Page() {
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
        <div key="c6d9051d-b395-40ab-869d-13f450742c24" style={{ position: 'absolute' as const, left: `1.5000%`, top: 24 * sy, width: `48.5000%`, height: 852 * sy }}><div className="h-full w-full bg-bg shadow-sm rounded-md" /></div>
        <div key="2115fb0e-9216-4e18-8328-b7d62ef57ac7" style={{ position: 'absolute' as const, left: `51.4375%`, top: 24 * sy, width: `47.0625%`, height: 256 * sy }}><div className="h-full w-full bg-bg shadow-sm rounded-md" /></div>
        <div key="3a4cffc1-2731-46ab-b6d0-8a8b5580908f" style={{ position: 'absolute' as const, left: `51.4375%`, top: 302 * sy, width: `47.0625%`, height: 574 * sy }}><div className="h-full w-full bg-bg shadow-sm rounded-md" /></div>
        <div key="b188448c-1705-41b1-99a5-570424f16840" style={{ position: 'absolute' as const, left: `1.5000%`, top: 370 * sy, width: `48.3125%`, height: 506 * sy }}><DataTable data={[]} columns={[{ id: 'c0', label: "Columna", accessor: () => null, filter: 'select' as const }]} /></div>
        <div className="flex h-full w-full flex-col justify-start" key="8f7f9467-ce7d-4d02-b527-83e22dd0518d" style={{ position: 'absolute' as const, left: `2.5000%`, top: 174 * sy, width: `16.2500%`, height: 38 * sy }}><Input placeholder="" /></div>
        <div className="flex h-full w-full flex-col justify-start" key="ab0aee82-3911-440f-ac3a-a8f701c06f4c" style={{ position: 'absolute' as const, left: `2.5000%`, top: 242 * sy, width: `16.2500%`, height: 38 * sy }}><Input placeholder="" /></div>
        <div className="flex h-full w-full flex-col justify-start" key="3858cdcd-6ebd-4e55-9bb5-99c938640246" style={{ position: 'absolute' as const, left: `2.5000%`, top: 302 * sy, width: `16.2500%`, height: 38 * sy }}><Input placeholder="" /></div>
        <div key="2455874c-4aef-487e-8629-c747e100951b" style={{ position: 'absolute' as const, left: `21.7500%`, top: 77 * sy, width: `7.5000%`, height: 32 * sy }}><Button type="button" variant="primary" size="sm" fullWidth>Botón</Button></div>
        <div className="flex h-full w-full items-center" key="92fae388-29b0-4da9-be96-0314571b1752" style={{ position: 'absolute' as const, left: `52.8750%`, top: 55 * sy, width: `13.7500%`, height: 40 * sy }}><_Sw0 /></div>
        <div key="1bbb7195-1bad-4507-b43d-e2ac6f3d0dba" style={{ position: 'absolute' as const, left: `52.8750%`, top: 122 * sy, width: `21.2500%`, height: 90 * sy }}><Accordion items={[{"id":"a0","title":"Sección","content":""}]} /></div>
        <div key="f6d0471f-bb24-44f6-a200-f3547da9db3b" style={{ position: 'absolute' as const, left: `52.8750%`, top: 302 * sy, width: `21.2500%`, height: 40 * sy }}><Tabs items={[{"id":"t0","label":"Pestaña"}]} defaultValue="t0" /></div>
        <div key="5b6e6072-d31c-4904-a4fb-9d65494b3c88" style={{ position: 'absolute' as const, left: `53.8750%`, top: 428 * sy, width: `22.5000%`, height: 80 * sy }}><Stepper steps={[{"label":"Paso"}]} current={0} /></div>
        <div className="flex h-full w-full flex-col justify-start" key="6ce34fa4-091f-4620-8ee5-af75d1fded05" style={{ position: 'absolute' as const, left: `62.0000%`, top: 538 * sy, width: `16.2500%`, height: 38 * sy }}><_S1 /></div>
        <div className="flex h-full w-full flex-col" key="4b4c7387-e2f5-40a8-ac0c-1a1927d4555f" style={{ position: 'absolute' as const, left: `58.3750%`, top: 613 * sy, width: `18.7500%`, height: 110 * sy }}><Textarea placeholder="" className="h-full resize-none" wrapperClassName="flex h-full flex-col" /></div>
      </div>
    </div>
  );
}
