import { useMemo } from 'react';
import {
  SortableContext,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { cn } from '../../../../shared/lib/cn.js';
import { PlusIcon } from '../../../../shared/components/icons/index.jsx';
import EditableModuleRow from './EditableModuleRow.jsx';
import {
  matchesQuery,
  useSearchQuery
} from '../../../../shared/search/SearchContext.js';

export default function SidebarBuilder({ builder, readOnly = false }) {
  const {
    modules,
    addModule,
    removeModule,
    renameModule,
    setModuleIcon,
    removeSubmodule,
    setSubmoduleIcon
  } = builder;

  // Filtrado por el buscador GLOBAL del header.
  //   - Si el nombre del módulo matchea → lo dejo con TODOS sus submódulos.
  //   - Si sólo matchean algunos submódulos → dejo el módulo con esa lista
  //     recortada, y lo fuerzo abierto para que el match sea visible.
  //   - Si nada matchea → oculto el módulo.
  // Como se aplica al `modules` que viene del builder en cada render,
  // funciona automáticamente para cualquier módulo nuevo que crees.
  const query = useSearchQuery();
  const hasQuery = query.trim().length > 0;
  const visibleModules = useMemo(() => {
    if (!hasQuery) return modules;
    return modules
      .map((m) => {
        const modMatch = matchesQuery(m.name, query);
        if (modMatch) return m;
        const filteredSubs = m.submodules.filter((s) =>
          matchesQuery(s.name, query)
        );
        if (filteredSubs.length > 0) return { ...m, submodules: filteredSubs };
        return null;
      })
      .filter(Boolean);
  }, [modules, query, hasQuery]);

  const moduleIds = visibleModules.map((m) => m.id);

  return (
    <aside className="flex h-full w-full flex-col overflow-hidden">
      {!readOnly && (
        <div className="px-3 pb-2">
          <button
            type="button"
            onClick={() => addModule()}
            className={cn(
              'flex h-9 w-full items-center justify-center gap-1.5 rounded-md',
              'bg-primary-50 text-[12.5px] font-semibold text-primary-700 outline-none transition-colors',
              'hover:bg-primary-100'
            )}
          >
            <PlusIcon width={13} height={13} strokeWidth={2.5} />
            Nuevo módulo
          </button>
        </div>
      )}

      <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-1">
        {modules.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[12px] text-fg-subtle">Sin módulos todavía</p>
            <p className="mt-1 text-[11px] text-fg-faint">
              Pulsa "Nuevo módulo" para empezar
            </p>
          </div>
        ) : visibleModules.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-[12px] text-fg-subtle">Sin resultados</p>
            <p className="mt-1 text-[11px] text-fg-faint">
              Ningún módulo ni submódulo coincide con "{query}"
            </p>
          </div>
        ) : (
          <SortableContext
            items={moduleIds}
            strategy={verticalListSortingStrategy}
          >
            <ul>
              {visibleModules.map((m) => (
                <EditableModuleRow
                  key={m.id}
                  module={m}
                  // Con query activa forzamos el módulo abierto para que
                  // los submódulos que matchean queden visibles aunque el
                  // usuario lo haya cerrado a mano.
                  forceOpen={hasQuery}
                  readOnly={readOnly}
                  onRemove={() => removeModule(m.id)}
                  onRename={(name) => renameModule(m.id, name)}
                  onIconChange={(svg) => setModuleIcon(m.id, svg)}
                  onRemoveSubmodule={(subId) => removeSubmodule(m.id, subId)}
                  onSubmoduleIconChange={(subId, svg) =>
                    setSubmoduleIcon(m.id, subId, svg)
                  }
                />
              ))}
            </ul>
          </SortableContext>
        )}
      </nav>
    </aside>
  );
}
