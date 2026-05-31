import { cn } from '../../../../shared/lib/cn.js';
import { PERMISSION_ACTIONS } from '../../domain/permission.value-objects.js';

function Chip({ active, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex h-6 items-center rounded-full px-2.5 text-[10.5px] font-medium outline-none',
        'transition-colors duration-150',
        active
          ? 'bg-primary text-on-primary hover:bg-primary-700'
          : 'bg-bg-muted text-fg-subtle hover:bg-primary-50 hover:text-primary-700'
      )}
    >
      {label}
    </button>
  );
}

export default function SubmoduleRow({ submodule, perms, onToggle, onToggleAll }) {
  const Icon = submodule.Icon;
  const allGranted = PERMISSION_ACTIONS.every((a) => perms[a.id]);

  return (
    <li className="flex flex-col items-stretch gap-1.5 rounded-md py-1.5 pl-10 pr-3 transition-colors hover:bg-bg-muted/60 sm:flex-row sm:items-center sm:gap-3">
      <div className="flex min-w-0 items-center gap-2 sm:flex-1">
        {Icon && (
          <Icon width={13} height={13} className="shrink-0 text-fg-faint" />
        )}
        <span className="min-w-0 flex-1 truncate text-[12px] text-fg">
          {submodule.label}
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-1 sm:shrink-0 sm:flex-nowrap">
        {PERMISSION_ACTIONS.map((a) => (
          <Chip
            key={a.id}
            label={a.label}
            active={!!perms[a.id]}
            onClick={() => onToggle(submodule.id, a.id)}
          />
        ))}
        <Chip
          label="Todo"
          active={allGranted}
          onClick={() => onToggleAll(submodule.id)}
        />
      </div>
    </li>
  );
}
