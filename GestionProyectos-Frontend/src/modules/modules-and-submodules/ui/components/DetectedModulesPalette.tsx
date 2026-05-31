import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '../../../../shared/lib/cn.js';
import {
  FolderIcon,
  GripIcon
} from '../../../../shared/components/icons/index.jsx';
import SearchInput from '../../../../shared/components/SearchInput/index.js';
import { matchesQuery } from '../../../../shared/search/SearchContext.js';

function FolderItem({ folder, used, usedBy, readOnly }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `folder-${folder.id}`,
    data: { type: 'folder', folderId: folder.id, label: folder.label },
    disabled: used || readOnly
  });

  return (
    <li
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      // touch-none impide que el navegador interprete el gesto como scroll,
      // así dnd-kit puede manejar el arrastre desde el primer touchmove.
      style={{ touchAction: used || readOnly ? 'auto' : 'none' }}
      className={cn(
        'flex items-center gap-2 rounded-md px-2.5 py-2 transition-colors',
        used || readOnly
          ? 'cursor-default bg-bg-muted opacity-70'
          : 'cursor-grab bg-bg-muted hover:bg-primary-50 active:cursor-grabbing',
        isDragging && 'opacity-40'
      )}
    >
      <FolderIcon
        width={14}
        height={14}
        className={cn('shrink-0', used ? 'text-fg-faint' : 'text-primary-700')}
      />
      <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-fg">
        {folder.label}
      </span>
      {used ? (
        <span
          title={`En uso por ${usedBy}`}
          className="max-w-[140px] shrink-0 truncate rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary-700"
        >
          {usedBy}
        </span>
      ) : (
        <GripIcon
          width={12}
          height={12}
          className="shrink-0 text-fg-faint"
        />
      )}
    </li>
  );
}

export default function DetectedModulesPalette({
  folders,
  folderUsage = {},
  readOnly = false
}) {
  // Filtro LOCAL — independiente del search global del header.  La paleta
  // tiene su propio buscador porque suele tener docenas de carpetas y
  // necesita acotarse sin afectar al resto de la app (que mientras tanto
  // puede estar respondiendo al search del header con otro propósito).
  const [query, setQuery] = useState('');
  const filtered = folders.filter((f) => matchesQuery(f.label, query));

  return (
    <div className="flex h-full flex-col gap-2">
      <div className="pr-1">
        <SearchInput
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar submódulo"
        />
      </div>

      <ul className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pr-1">
        {filtered.map((f) => {
          const usedBy = folderUsage[f.id];
          return (
            <FolderItem
              key={f.id}
              folder={f}
              used={!!usedBy}
              usedBy={usedBy}
              readOnly={readOnly}
            />
          );
        })}
        {filtered.length === 0 && (
          <li className="px-3 py-4 text-center text-[11px] text-fg-faint">
            {query ? 'Sin resultados' : 'Sin carpetas'}
          </li>
        )}
      </ul>
    </div>
  );
}
