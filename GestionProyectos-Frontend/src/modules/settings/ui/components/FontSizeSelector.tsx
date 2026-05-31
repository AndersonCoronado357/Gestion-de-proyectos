import { cn } from '../../../../shared/lib/cn.js';

const sizes = [
  { id: 'xs', label: 'XS', size: 12 },
  { id: 'sm', label: 'SM', size: 13 },
  { id: 'md', label: 'MD', size: 14 },
  { id: 'lg', label: 'LG', size: 15 },
  { id: 'xl', label: 'XL', size: 16 }
];

export default function FontSizeSelector({ value, onChange }) {
  return (
    <div className="grid w-full grid-cols-5 gap-1.5">
      {sizes.map((s) => {
        const active = value === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onChange?.(s.id)}
            className={cn(
              'flex h-12 flex-col items-center justify-center rounded-lg outline-none transition-colors',
              active ? 'bg-primary-50' : 'bg-bg-muted hover:bg-bg'
            )}
          >
            <span
              style={{ fontSize: `${s.size}px`, lineHeight: 1 }}
              className={cn(
                'font-semibold',
                active ? 'text-primary-700' : 'text-fg-subtle'
              )}
            >
              Aa
            </span>
            <span
              className={cn(
                'mt-0.5 text-[9px] uppercase tracking-wider',
                active ? 'text-primary-600' : 'text-fg-faint'
              )}
            >
              {s.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export { sizes as FONT_SIZES };
