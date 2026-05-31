import { cn } from '../../../../shared/lib/cn.js';

const options = [
  { id: 'light', label: 'Claro' },
  { id: 'dark', label: 'Oscuro' }
];

function MiniPreview({ mode, scale, accentHex }) {
  const isDark = mode === 'dark';

  // Colores del preview, tinted con el accent en dark mode
  const main = isDark ? mixHex(scale?.[900] ?? '#000', '#000', 0.4) : '#ffffff';
  const panel = isDark ? scale?.[900] ?? '#0a1410' : '#f8fafc';
  const bar = isDark ? scale?.[700] ?? '#444' : '#cbd5e1';
  const barDim = isDark ? scale?.[800] ?? '#222' : '#e2e8f0';

  return (
    <div
      className="flex h-16 w-full overflow-hidden rounded-md border border-border"
      style={{ backgroundColor: main }}
    >
      <div
        className="flex w-1/3 flex-col gap-1.5 p-2"
        style={{ backgroundColor: panel }}
      >
        <span
          style={{ backgroundColor: bar }}
          className="h-1.5 w-3/4 rounded-full"
        />
        <span
          style={{ backgroundColor: bar }}
          className="h-1.5 w-1/2 rounded-full"
        />
        <span
          style={{ backgroundColor: accentHex }}
          className="h-1.5 w-2/3 rounded-full"
        />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-2">
        <span
          style={{ backgroundColor: bar }}
          className="h-1.5 w-1/2 rounded-full"
        />
        <span
          style={{ backgroundColor: barDim }}
          className="h-1.5 w-3/4 rounded-full"
        />
        <span
          style={{ backgroundColor: barDim }}
          className="h-1.5 w-2/3 rounded-full"
        />
      </div>
    </div>
  );
}

function mixHex(hexA, hexB, t) {
  const a = hexA.replace('#', '');
  const b = hexB.replace('#', '');
  const ar = parseInt(a.slice(0, 2), 16);
  const ag = parseInt(a.slice(2, 4), 16);
  const ab = parseInt(a.slice(4, 6), 16);
  const br = parseInt(b.slice(0, 2), 16);
  const bg = parseInt(b.slice(2, 4), 16);
  const bb = parseInt(b.slice(4, 6), 16);
  const r = Math.round(ar * (1 - t) + br * t);
  const g = Math.round(ag * (1 - t) + bg * t);
  const bl = Math.round(ab * (1 - t) + bb * t);
  const toHex = (v) => v.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(bl)}`;
}

export default function ModeToggle({ value, onChange, scale, accentHex }) {
  return (
    <div className="grid w-full grid-cols-2 gap-2.5">
      {options.map(({ id, label }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange?.(id)}
            className={cn(
              'flex flex-col gap-2 rounded-lg p-2.5 text-left outline-none transition-colors',
              active ? 'bg-primary-50' : 'bg-bg-muted hover:bg-bg'
            )}
          >
            <MiniPreview mode={id} scale={scale} accentHex={accentHex} />
            <div className="flex items-center justify-between px-1">
              <span
                className={cn(
                  'text-[12.5px] font-semibold',
                  active ? 'text-primary-700' : 'text-fg'
                )}
              >
                {label}
              </span>
              <span
                className={cn(
                  'h-3 w-3 rounded-full transition-colors',
                  active ? 'bg-primary' : 'bg-fg-faint/30'
                )}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
