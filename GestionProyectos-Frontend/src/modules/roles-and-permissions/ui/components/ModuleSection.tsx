import { useState } from 'react';
import { cn } from '../../../../shared/lib/cn.js';
import { ChevronRightIcon } from '../../../../shared/components/icons/index.jsx';
import { PERMISSION_ACTIONS } from '../../domain/permission.value-objects.js';
import SubmoduleRow from './SubmoduleRow.jsx';

export default function ModuleSection({
  module,
  permissions,
  defaultOpen = false,
  onTogglePermission,
  onToggleModuleAll,
  onToggleSubmoduleAll,
  className,
  style
}) {
  const [open, setOpen] = useState(defaultOpen);
  const Icon = module.Icon;

  const allFullyGranted =
    module.submodules.length > 0 &&
    module.submodules.every((s) => {
      const p = permissions[s.id];
      return p && PERMISSION_ACTIONS.every((a) => p[a.id]);
    });

  return (
    <li className={className} style={style}>
      <div
        className={cn(
          'group flex items-center gap-3 rounded-md pl-3 pr-2 transition-colors',
          'hover:bg-bg-muted'
        )}
      >
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-3 py-2 text-left outline-none"
        >
          <ChevronRightIcon
            width={13}
            height={13}
            className={cn(
              'shrink-0 text-fg-faint transition-transform duration-200',
              open && 'rotate-90'
            )}
          />
          {Icon && (
            <Icon width={15} height={15} className="shrink-0 text-fg-subtle" />
          )}
          <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-fg">
            {module.label}
          </span>
          <span className="shrink-0 text-[10.5px] text-fg-faint">
            {module.submodules.length} submódulos
          </span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleModuleAll(module.submodules.map((s) => s.id));
          }}
          title="Conceder todos los permisos de este módulo"
          className={cn(
            'inline-flex h-6 shrink-0 items-center rounded-full px-2.5 text-[10.5px] font-medium outline-none',
            'transition-colors duration-150',
            allFullyGranted
              ? 'bg-primary text-on-primary hover:bg-primary-700'
              : 'bg-bg-muted text-fg-subtle hover:bg-primary-50 hover:text-primary-700'
          )}
        >
          Todo
        </button>
      </div>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-smooth',
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <ul className="overflow-hidden">
          {module.submodules.map((s) => (
            <SubmoduleRow
              key={s.id}
              submodule={s}
              perms={permissions[s.id] ?? {}}
              onToggle={onTogglePermission}
              onToggleAll={onToggleSubmoduleAll}
            />
          ))}
        </ul>
      </div>
    </li>
  );
}
