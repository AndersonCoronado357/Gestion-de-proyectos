// CreateSubmoduleHubPage — pantalla inicial al crear un submódulo.
//
// 2 contenedores (cards) con padding alrededor.  El nombre del
// submódulo se escribe directamente en el "título" del card derecho
// (input estilo título, autoFocus, sin label aparte).

import { useState, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../../../shared/lib/cn.js';
import Button from '../../../../shared/components/Button/index.js';
import {
  DatabaseIcon,
  LayoutIcon,
  ZapIcon,
  ApiIcon,
  KeyIcon,
  ChevronRightIcon,
  PlusIcon
} from '../../../../shared/components/icons/index.js';
import ProjectStructureTree from '../components/ProjectStructureTree.js';

interface Section {
  id: 'db' | 'front' | 'logic' | 'apis' | 'perms';
  title: string;
  description: string;
  Icon: ComponentType<{ width?: number; height?: number; strokeWidth?: number }>;
  route?: string;
}

const SECTIONS: ReadonlyArray<Section> = [
  {
    id: 'front',
    title: 'Front',
    description: 'Constructor visual de la pantalla.',
    Icon: LayoutIcon
  },
  {
    id: 'db',
    title: 'Base de datos',
    description: 'Tablas, columnas y relaciones del submódulo.',
    Icon: DatabaseIcon
  },
  {
    id: 'apis',
    title: 'APIs',
    description: 'APIs consumidas.',
    Icon: ApiIcon
  },
  {
    id: 'logic',
    title: 'Lógica',
    description: 'Conexión del front con el backend.',
    Icon: ZapIcon
  },
  {
    id: 'perms',
    title: 'Permisos',
    description: 'Decidir qué acciones se van a hacer.',
    Icon: KeyIcon
  }
];

export default function CreateSubmoduleHubPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');

  return (
    <div className="flex h-full gap-4 overflow-hidden bg-page p-4 lg:p-6">
      {/* ── Card 1: estructura del proyecto (con Volver arriba) ── */}
      <aside className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-xl bg-bg shadow-sm">
        <ProjectStructureTree name={name} onBack={() => navigate(-1)} />
      </aside>

      {/* ── Card 2: header (input-título) + 3 opciones ── */}
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-bg shadow-sm">
        {/* Header: input título (el nombre del submódulo), centrado. */}
        <div className="flex shrink-0 items-center justify-center border-b border-border-subtle px-5 py-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del nuevo submódulo"
            autoFocus
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-center text-[13px] font-semibold tracking-tight text-fg outline-none placeholder:font-normal placeholder:text-fg-faint"
          />
        </div>

        {/* 5 opciones apiladas, ocupando todo el alto disponible. */}
        <div className="grid min-h-0 flex-1 grid-rows-5 gap-3 p-5">
          {SECTIONS.map(({ id, title, description, Icon, route }) => (
            <button
              key={id}
              type="button"
              onClick={() => route && navigate(route)}
              className={cn(
                'group flex w-full items-center gap-5 rounded-xl bg-primary-50 px-5 py-4 text-left outline-none transition-colors duration-150',
                'hover:bg-primary-100/70 dark:bg-primary-500/10 dark:hover:bg-primary-500/20'
              )}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary shadow-sm">
                <Icon width={18} height={18} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-[14px] font-semibold tracking-tight text-fg">
                  {title}
                </h3>
                <p className="mt-1 text-[12px] text-fg-muted">
                  {description}
                </p>
              </div>
              <ChevronRightIcon
                width={16}
                height={16}
                className="shrink-0 text-primary-700 transition-transform group-hover:translate-x-0.5"
              />
            </button>
          ))}
        </div>

        {/* Footer con botón de crear. */}
        <div className="flex shrink-0 items-center justify-end border-t border-border-subtle px-5 py-3">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<PlusIcon width={13} height={13} strokeWidth={2.5} />}
            disabled={!name.trim()}
            onClick={() => {
              // Wiring del create real va acá cuando lo definamos.
              // Por ahora solo log para no romper nada.
              console.log('Crear submódulo:', name.trim());
            }}
          >
            Crear submódulo
          </Button>
        </div>
      </main>
    </div>
  );
}
