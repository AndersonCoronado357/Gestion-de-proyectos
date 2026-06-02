import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../../../shared/lib/cn.js';
import { BoxIcon } from '../../../../shared/icons/index.js';
import { normalizeSvg, isLikelySvg } from '../lib/svg.js';

export interface IconPasteButtonProps {
  iconSvg?: string | null;
  onChange?: (svg: string | null) => void;
  size?: number;
  className?: string;
}

export default function IconPasteButton({
  iconSvg,
  onChange,
  size = 17,
  className
}: IconPasteButtonProps) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [draft, setDraft] = useState('');
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const btnRef = useRef<HTMLButtonElement | null>(null);

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
    setDraft(iconSvg ?? '');
  }, [open, iconSvg]);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: globalThis.MouseEvent) => {
      const popup = document.getElementById('icon-paste-popup');
      const target = e.target as Node | null;
      if (popup && target && popup.contains(target)) return;
      if (btnRef.current && target && btnRef.current.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const apply = () => {
    if (!draft.trim()) {
      onChange?.(null);
      setOpen(false);
      return;
    }
    if (!isLikelySvg(draft)) return;
    onChange?.(normalizeSvg(draft));
    setOpen(false);
  };

  const clear = () => {
    setDraft('');
    onChange?.(null);
    setOpen(false);
  };

  const previewSvg = draft && isLikelySvg(draft) ? normalizeSvg(draft) : null;

  // Sólo renderizamos el popup tras calcular su posición. Esto evita el
  // parpadeo en la esquina superior izquierda en el primer paint.
  const popup =
    open && ready
      ? createPortal(
          <div
            id="icon-paste-popup"
            className="fixed z-[100] w-72 rounded-lg bg-bg p-3 shadow-lg"
            style={{ top: pos.top, left: pos.left }}
            onClick={(e) => e.stopPropagation()}
          >
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Pega aquí <svg>...</svg>"
              spellCheck={false}
              className={cn(
                'h-24 w-full resize-none rounded-md bg-bg-muted p-2',
                'font-mono text-[11px] text-fg placeholder:text-fg-faint outline-none'
              )}
            />

            <div className="mt-2 flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-bg-muted text-fg-muted">
                {previewSvg ? (
                  <span
                    className="block h-4 w-4"
                    dangerouslySetInnerHTML={{ __html: previewSvg }}
                  />
                ) : null}
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                {iconSvg && (
                  <button
                    type="button"
                    onClick={clear}
                    className="h-7 rounded-md px-2 text-[11px] font-medium text-fg-muted outline-none transition-colors hover:text-danger-text"
                  >
                    Quitar
                  </button>
                )}
                <button
                  type="button"
                  onClick={apply}
                  disabled={draft.trim() !== '' && !previewSvg}
                  className={cn(
                    'h-7 rounded-md bg-primary px-2.5 text-[11px] font-semibold text-on-primary outline-none transition-colors',
                    'hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-50'
                  )}
                >
                  Aplicar
                </button>
              </div>
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
        title={iconSvg ? 'Cambiar icono' : 'Añadir SVG'}
        className={cn(
          'inline-flex shrink-0 items-center justify-center rounded outline-none',
          iconSvg
            ? 'text-current hover:opacity-70'
            : 'text-fg-faint hover:text-primary',
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
