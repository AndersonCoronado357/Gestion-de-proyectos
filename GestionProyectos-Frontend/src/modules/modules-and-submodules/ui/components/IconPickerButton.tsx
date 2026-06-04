// Selector de icono desde el CATÁLOGO ya subido (en vez de pegar SVG nuevo).
//
// Botón compacto con el icono actual; al click abre un popover-grid con
// todos los iconos del catálogo + buscador. Click en uno → lo aplica.
// "Quitar" lo desasocia. Para subir uno nuevo: módulo Administración → Iconos.

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../../shared/lib/cn.js';
import { BoxIcon, SearchIcon } from '../../../../shared/icons/index.js';
import { listIcons, type IconItem } from '../../../icons/api.js';

export interface IconPickerButtonProps {
  iconSvg?: string | null;
  onChange?: (svg: string | null) => void;
  size?: number;
  className?: string;
}

export default function IconPickerButton({
  iconSvg,
  onChange,
  size = 17,
  className
}: IconPickerButtonProps) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [query, setQuery] = useState('');
  const [icons, setIcons] = useState<IconItem[]>([]);
  const [loading, setLoading] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);

  // Cargar catálogo cuando se abre.
  useEffect(() => {
    if (!open) {
      setReady(false);
      return;
    }
    const rect = btnRef.current?.getBoundingClientRect();
    if (rect) {
      setPos({ top: rect.bottom + 6, left: rect.left });
      setReady(true);
    }
    setLoading(true);
    listIcons({ limit: 500 })
      .then((r) => setIcons(r.items))
      .catch(() => setIcons([]))
      .finally(() => setLoading(false));
  }, [open]);

  // Cerrar al click afuera.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      const popup = document.getElementById('icon-picker-popup');
      const t = e.target as Node | null;
      if (popup && t && popup.contains(t)) return;
      if (btnRef.current && t && btnRef.current.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const filtered = query.trim()
    ? icons.filter((i) =>
        (i.name ?? '').toLowerCase().includes(query.trim().toLowerCase())
      )
    : icons;

  const popup =
    open && ready
      ? createPortal(
          <div
            id="icon-picker-popup"
            className="fixed z-[100] flex w-80 flex-col overflow-hidden rounded-lg bg-bg shadow-lg ring-1 ring-black/5"
            style={{ top: pos.top, left: pos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle px-3 py-2">
              <SearchIcon width={12} height={12} className="shrink-0 text-fg-faint" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar icono..."
                className="h-7 flex-1 bg-transparent text-[12px] text-fg placeholder:text-fg-faint outline-none"
              />
              {iconSvg && (
                <button
                  type="button"
                  onClick={() => {
                    onChange?.(null);
                    setOpen(false);
                  }}
                  className="rounded px-1.5 py-0.5 text-[10.5px] font-medium text-fg-muted outline-none transition-colors hover:text-danger-text"
                >
                  Quitar
                </button>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto p-2">
              {loading ? (
                <p className="px-2 py-3 text-center text-[11px] text-fg-faint">
                  Cargando catálogo…
                </p>
              ) : filtered.length === 0 ? (
                <p className="px-2 py-3 text-center text-[11px] text-fg-faint">
                  {icons.length === 0
                    ? 'Sin iconos en el catálogo. Subí uno desde Administración → Iconos.'
                    : 'Ningún icono coincide con la búsqueda.'}
                </p>
              ) : (
                <div className="grid grid-cols-6 gap-1.5">
                  {filtered.map((it) => (
                    <button
                      key={it.id}
                      type="button"
                      title={it.name ?? ''}
                      onClick={() => {
                        onChange?.(it.svg);
                        setOpen(false);
                      }}
                      className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-md outline-none transition-colors',
                        '[&_svg]:h-5 [&_svg]:w-5',
                        iconSvg === it.svg
                          ? 'bg-primary text-on-primary'
                          : 'text-fg hover:bg-bg-muted'
                      )}
                      dangerouslySetInnerHTML={{ __html: it.svg }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        title={iconSvg ? 'Cambiar icono' : 'Elegir icono del catálogo'}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded outline-none',
          iconSvg ? 'text-current hover:opacity-70' : 'text-fg-faint hover:text-primary',
          className
        )}
        style={{ width: size, height: size }}
      >
        {iconSvg ? (
          <span
            className="block"
            style={{ width: size, height: size, lineHeight: 0 }}
            dangerouslySetInnerHTML={{ __html: iconSvg }}
          />
        ) : (
          <BoxIcon width={size} height={size} className="opacity-40" />
        )}
      </button>
      {popup}
    </>
  );
}
