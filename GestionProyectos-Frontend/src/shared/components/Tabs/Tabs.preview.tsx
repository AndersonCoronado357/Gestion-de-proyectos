import { useState } from 'react';
import Tabs from './Tabs.js';

export const meta = { id: 'tabs', name: 'Tabs (pestañas)' };

const ITEMS = [
  { id: 'general', label: 'General' },
  { id: 'integraciones', label: 'Integraciones' },
  { id: 'facturacion', label: 'Facturación' }
];

export default function TabsPreview() {
  const [v, setV] = useState('general');
  return (
    <div className="flex flex-col gap-3">
      <Tabs items={ITEMS} value={v} onChange={setV} />
      <p className="text-[12.5px] text-fg-muted">
        Contenido de la pestaña: <span className="font-semibold text-fg">{v}</span>
      </p>
    </div>
  );
}
