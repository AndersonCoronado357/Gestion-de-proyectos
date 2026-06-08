// Panel lateral: detalle de un icono.
// Usa Input/Textarea/Button del catálogo compartido. Footer con Eliminar +
// Guardar en una misma fila. SVG con autosave debounced (realtime).

import { useEffect, useRef, useState } from 'react';
import { cn } from '../../../../shared/lib/cn.js';
import Input from '../../../../shared/components/Input/index.js';
import Textarea from '../../../../shared/components/Textarea/index.js';
import Button from '../../../../shared/components/Button/index.js';
import { CheckIcon, TrashIcon, XIcon } from '../../../../shared/icons/index.js';
import { normalizeIconSvg } from '../lib/normalizeIconSvg.js';
import type { IconItem } from '../../api.js';

interface Props {
  icon: IconItem;
  busy: boolean;
  onClose: () => void;
  onRename: (id: number, displayName: string | null) => Promise<void>;
  onUpdateSvg: (id: number, svg: string) => Promise<IconItem | null>;
  onDelete: (id: number) => Promise<void>;
}

const AUTOSAVE_MS = 500;

export default function IconSidePanel({
  icon,
  busy,
  onClose,
  onRename,
  onUpdateSvg,
  onDelete
}: Props) {
  const [name, setName] = useState(icon.displayName ?? '');
  const [svg, setSvg] = useState(icon.svg);
  const [error, setError] = useState<string | null>(null);
  const [savingSvg, setSavingSvg] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Resincroniza al cambiar de icono seleccionado.
  useEffect(() => {
    setName(icon.displayName ?? '');
    setSvg(icon.svg);
    setError(null);
    setSavedAt(null);
  }, [icon.id]);

  // Autosave debounced del SVG mientras el usuario edita.
  useEffect(() => {
    if (svg === icon.svg) return;
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(async () => {
      setError(null);
      setSavingSvg(true);
      try {
        await onUpdateSvg(icon.id, svg);
        setSavedAt(Date.now());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'No se pudo guardar el SVG');
      } finally {
        setSavingSvg(false);
      }
    }, AUTOSAVE_MS);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svg]);

  const dirtyName = (name || null) !== (icon.displayName || null);
  const canDelete = !icon.usageCount;
  const validSvg = svg.trim().startsWith('<svg');

  const handleSave = async (): Promise<void> => {
    if (!dirtyName) return;
    try {
      await onRename(icon.id, name.trim() || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!canDelete) return;
    try {
      await onDelete(icon.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    }
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-2 px-5 py-3">
        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
          Detalle del icono
        </span>
        <button
          type="button"
          onClick={onClose}
          title="Cerrar panel"
          className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-fg-faint outline-none transition-colors hover:bg-danger-surface hover:text-danger-text"
        >
          <XIcon width={11} height={11} />
        </button>
      </div>

      <div className="h-px shrink-0 bg-border-subtle" />

      <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-hidden px-5 py-5">
        <div className="flex flex-col items-center gap-2">
          <span
            className={cn(
              'flex h-20 w-20 items-center justify-center rounded-xl bg-bg-muted text-fg-muted',
              '[&_svg]:h-12 [&_svg]:w-12'
            )}
            dangerouslySetInnerHTML={{ __html: normalizeIconSvg(validSvg ? svg : icon.svg) }}
          />
          <p className="break-all text-center text-[12.5px] font-medium text-fg">
            {icon.displayName ?? <span className="italic text-fg-faint">sin nombre</span>}
          </p>
          {icon.name && (
            <p className="font-mono text-[10.5px] text-fg-faint">{icon.name}</p>
          )}
          {icon.usageCount != null && (
            <div className="flex flex-col items-center gap-0.5 text-[11px] text-fg-faint">
              <p>
                <b className="text-fg">{icon.usageCount}</b> uso
                {icon.usageCount === 1 ? '' : 's'} totales
              </p>
              <p>
                Sidebar: <b className="text-fg">{icon.sidebarUsageCount ?? 0}</b>
                {' · '}
                Código: <b className="text-fg">{icon.codeUsageCount ?? 0}</b>
              </p>
            </div>
          )}
        </div>

        {(icon.sidebarUsageRefs?.length ?? 0) > 0 && (
          <div className="flex max-h-24 shrink-0 flex-col gap-1 overflow-y-auto rounded-lg bg-bg-muted/30 px-3 py-2">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
              Sidebar ({icon.sidebarUsageRefs?.length})
            </span>
            <ul className="flex flex-col gap-0.5">
              {icon.sidebarUsageRefs?.map((r, i) => (
                <li
                  key={`${r}-${i}`}
                  className="truncate text-[11px] text-fg-muted"
                  title={r}
                >
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {(icon.codeUsageFiles?.length ?? 0) > 0 && (
          <div className="flex max-h-32 shrink-0 flex-col gap-1 overflow-y-auto rounded-lg bg-bg-muted/30 px-3 py-2">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
              Archivos del código ({icon.codeUsageFiles?.length})
            </span>
            <ul className="flex flex-col gap-0.5">
              {icon.codeUsageFiles?.map((f) => (
                <li
                  key={f}
                  className="truncate font-mono text-[10.5px] text-fg-muted"
                  title={f}
                >
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Input
          label="Nombre visible"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="(sin nombre)"
        />

        <div className="h-px shrink-0 bg-border-subtle" />

        {/* Bloque SVG ocupa todo el alto sobrante del panel; el scroll
            (cuando hace falta) vive DENTRO del textarea, nunca en el panel. */}
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="mb-1.5 flex shrink-0 items-center justify-between">
            <span className="text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
              SVG
            </span>
            <span className="text-[10.5px] text-fg-faint">
              {savingSvg ? (
                'Guardando…'
              ) : error ? (
                <span className="text-danger-text">{error}</span>
              ) : savedAt ? (
                'Guardado'
              ) : (
                ''
              )}
            </span>
          </div>
          <Textarea
            ref={taRef}
            value={svg}
            onChange={(e) => setSvg(e.target.value)}
            spellCheck={false}
            wrapperClassName="flex min-h-0 flex-1 flex-col"
            className="h-full resize-none overflow-auto font-mono text-[11.5px] leading-relaxed"
          />
          <div className="mt-2 flex shrink-0 justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigator.clipboard?.writeText(svg)}
            >
              Copiar SVG
            </Button>
          </div>
        </div>

        {!canDelete && (
          <p className="text-[11px] text-fg-faint">
            No se puede eliminar mientras esté en uso.
          </p>
        )}
      </div>

      {/* Footer fijo con acciones Eliminar + Guardar en una fila. */}
      <div className="h-px shrink-0 bg-border-subtle" />
      <div className="flex shrink-0 items-center justify-between gap-3 px-5 py-3">
        <Button
          type="button"
          variant="danger"
          size="sm"
          disabled={!canDelete || busy}
          onClick={handleDelete}
          leftIcon={<TrashIcon width={13} height={13} />}
        >
          Eliminar
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={!dirtyName || busy}
          onClick={handleSave}
          leftIcon={<CheckIcon width={13} height={13} />}
        >
          Guardar
        </Button>
      </div>
    </div>
  );
}
