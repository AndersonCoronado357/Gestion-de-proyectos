import { cn } from '../../../../shared/lib/cn.js';
import { CheckIcon } from '../../../../shared/components/icons/index.jsx';

const PREVIEW = 'Texto de prueba con esta letra';

export default function FontFamilyList({ fonts, value, onChange }) {
  return (
    <ul className="h-full w-full space-y-1.5 overflow-y-auto pr-1">
      {fonts.map((font) => {
        const active = value === font.id;
        return (
          <li key={font.id}>
            <button
              type="button"
              onClick={() => onChange?.(font.id)}
              className={cn(
                'flex h-12 w-full items-center justify-between rounded-md px-3 outline-none transition-colors',
                active ? 'bg-primary-50' : 'bg-bg hover:bg-bg-muted'
              )}
            >
              <div className="flex min-w-0 flex-col items-start leading-tight">
                <span
                  style={{ fontFamily: font.stack }}
                  className={cn(
                    'truncate text-[12.5px] font-semibold',
                    active ? 'text-primary-700' : 'text-fg'
                  )}
                >
                  {font.label}
                </span>
                <span
                  style={{ fontFamily: font.stack }}
                  className="truncate text-[10.5px] text-fg-subtle"
                >
                  {PREVIEW}
                </span>
              </div>
              {active && (
                <CheckIcon
                  width={13}
                  height={13}
                  strokeWidth={3}
                  className="ml-2 shrink-0 text-primary"
                />
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
