import { useState } from 'react';
import FilterBar from './FilterBar.js';

export const meta = { id: 'filter-bar', name: 'FilterBar (barra de filtros)' };

const LEVELS = [
  { value: 'all', label: 'Todos los niveles' },
  { value: 'error', label: 'Error' },
  { value: 'warn', label: 'Advertencia' },
  { value: 'info', label: 'Info' }
];
const STATES = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'open', label: 'Abiertos' },
  { value: 'closed', label: 'Cerrados' }
];

export default function FilterBarPreview() {
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('all');
  const [state, setState] = useState('all');
  return (
    <div className="flex flex-col gap-3">
      <FilterBar
        search={{
          value: search,
          onChange: setSearch,
          placeholder: 'Buscar por nombre, correo, ID…'
        }}
        selects={[
          { id: 'level', options: LEVELS, value: level, onChange: setLevel, width: 180 },
          { id: 'state', options: STATES, value: state, onChange: setState, width: 180 }
        ]}
      />
      <p className="text-[11.5px] text-fg-muted">
        Búsqueda: <span className="font-mono text-fg">{search || '—'}</span> · Nivel:{' '}
        <span className="font-mono text-fg">{level}</span> · Estado:{' '}
        <span className="font-mono text-fg">{state}</span>
      </p>
    </div>
  );
}
