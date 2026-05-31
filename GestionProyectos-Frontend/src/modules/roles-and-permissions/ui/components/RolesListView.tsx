import { useState } from 'react';
import { cn } from '../../../../shared/lib/cn.js';
import {
  PlusIcon,
  TrashIcon,
  ShieldIcon
} from '../../../../shared/components/icons/index.jsx';
import SearchInput from '../../../../shared/components/SearchInput/index.js';
import { isPlaceholderRoleName } from '../hooks/useRolesBuilder.js';

export default function RolesListView({
  roles,
  selectedRoleId,
  statsByRole,
  canCreate = true,
  canDelete = true,
  onSelect,
  onCreate,
  onDelete
}) {
  const [query, setQuery] = useState('');

  const filtered = roles.filter((r) =>
    r.name.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <div className="flex h-full flex-col animate-[fade-in_180ms_ease-out]">
      <div className="flex shrink-0 items-center gap-2 px-5 pt-5">
        <div className="flex-1">
          <SearchInput
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Buscar entre ${roles.length} roles`}
          />
        </div>
        {canCreate && (
          <button
            type="button"
            onClick={onCreate}
            className={cn(
              'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3',
              'text-[12px] font-semibold text-on-primary outline-none transition-colors',
              'hover:bg-primary-700'
            )}
          >
            <PlusIcon width={13} height={13} strokeWidth={2.5} />
            Nuevo rol
          </button>
        )}
      </div>

      <ul className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {filtered.map((r, i) => {
          const active = r.id === selectedRoleId;
          const grants = statsByRole[r.id]?.grants ?? 0;
          return (
            <li
              key={r.id}
              className="group animate-[slide-up-fade_200ms_ease-out_both]"
              style={{ animationDelay: `${i * 30}ms` }}
            >
              <button
                type="button"
                onClick={() => onSelect(r.id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg px-3 py-3 text-left outline-none transition-colors',
                  active
                    ? 'bg-primary-50'
                    : 'hover:bg-bg-muted'
                )}
              >
                <ShieldIcon
                  width={16}
                  height={16}
                  className={cn(
                    'mt-0.5 shrink-0',
                    active ? 'text-primary-700' : 'text-fg-faint'
                  )}
                />
                <div className="min-w-0 flex-1 leading-snug">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'truncate text-[13.5px] font-semibold',
                        active ? 'text-primary-700' : 'text-fg',
                        isPlaceholderRoleName(r.name) && 'italic text-fg-faint'
                      )}
                    >
                      {isPlaceholderRoleName(r.name) ? 'Sin nombre' : r.name}
                    </span>
                    {grants > 0 && (
                      <span
                        className={cn(
                          'shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                          active
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-bg-muted text-fg-subtle'
                        )}
                      >
                        {grants}
                      </span>
                    )}
                  </div>
                  <p
                    className={cn(
                      'mt-0.5 truncate text-[12px]',
                      active ? 'text-primary-700/80' : 'text-fg-muted'
                    )}
                  >
                    {r.description || 'Sin descripción'}
                  </p>
                </div>

                {r.isSuper ? (
                  <span
                    className="self-center shrink-0 rounded-full bg-primary-50 px-2 py-0.5 text-[9.5px] font-semibold uppercase tracking-wider text-primary-700 dark:bg-primary-500/15 dark:text-primary-300"
                    title="Rol del sistema — no se puede eliminar"
                  >
                    Sistema
                  </span>
                ) : canDelete ? (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(r.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        onDelete(r.id);
                      }
                    }}
                    title="Eliminar rol"
                    className="self-center shrink-0 rounded-md p-1 text-fg-faint outline-none opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-500/15 dark:hover:text-red-400"
                  >
                    <TrashIcon width={13} height={13} />
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
        {filtered.length === 0 && (
          <li className="px-3 py-6 text-center text-[11px] text-fg-faint">
            {query ? 'Sin resultados' : 'Sin roles'}
          </li>
        )}
      </ul>
    </div>
  );
}
