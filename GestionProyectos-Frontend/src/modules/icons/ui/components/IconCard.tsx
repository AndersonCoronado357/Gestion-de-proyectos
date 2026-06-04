// Card de un icono en la galería: preview + nombre + chip de uso en la
// esquina superior derecha. Click → selecciona (abre panel lateral).
// Sin bordes de color: el seleccionado se distingue por fondo más cargado.

import { cn } from '../../../../shared/lib/cn.js';
import Badge from '../../../../shared/components/Badge/index.js';
import { normalizeIconSvg } from '../lib/normalizeIconSvg.js';
import type { IconItem } from '../../api.js';

interface Props {
  icon: IconItem;
  selected: boolean;
  onSelect: () => void;
}

export default function IconCard({ icon, selected, onSelect }: Props) {
  const label = icon.displayName ?? icon.name ?? null;
  const used = (icon.usageCount ?? 0) > 0;
  return (
    <button
      type="button"
      onClick={onSelect}
      title={label ?? '(sin nombre)'}
      className={cn(
        'group relative flex flex-col items-center gap-1.5 rounded-lg p-3 outline-none transition-colors duration-150',
        // Sin borde de color: el seleccionado usa fondo primary tintado.
        selected
          ? 'bg-primary-100 dark:bg-primary-700/35'
          : 'bg-bg-muted hover:bg-bg-muted/70'
      )}
    >
      {/* Chip de uso en esquina superior derecha. Sólo aparece si > 0. */}
      {used && (
        <span className="absolute right-1.5 top-1.5">
          <Badge variant="primary" size="sm">
            {icon.usageCount} uso{icon.usageCount === 1 ? '' : 's'}
          </Badge>
        </span>
      )}
      <span
        className={cn(
          // text-fg-muted: el SVG hereda el color "atenuado" del tema (gris
          // oscuro en claro, gris claro en oscuro), igual que los iconos del
          // sidebar y del módulo de modules-and-submodules. Los SVG multi-
          // color (Google) traen sus propios fills y los respetan; los
          // outline normales toman el tono del tema.
          'flex h-9 w-9 items-center justify-center text-fg-muted',
          '[&_svg]:h-7 [&_svg]:w-7'
        )}
        dangerouslySetInnerHTML={{ __html: normalizeIconSvg(icon.svg) }}
      />
      <span className="line-clamp-1 w-full text-center text-[10.5px] font-medium text-fg-muted">
        {label ?? <span className="italic text-fg-faint">sin nombre</span>}
      </span>
    </button>
  );
}
