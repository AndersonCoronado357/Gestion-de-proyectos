// Caja inline para subir un SVG nuevo: Input + Textarea + Button del catálogo
// compartido. Preview en vivo a la derecha.

import { useState } from 'react';
import { cn } from '../../../../shared/lib/cn.js';
import Input from '../../../../shared/components/Input/index.js';
import Textarea from '../../../../shared/components/Textarea/index.js';
import Button from '../../../../shared/components/Button/index.js';
import { PlusIcon } from '../../../../shared/icons/index.js';
import { normalizeIconSvg } from '../lib/normalizeIconSvg.js';

function isLikelySvg(s: string): boolean {
  return /^\s*<svg\b/.test(s) && /<\/svg>\s*$/.test(s);
}

interface Props {
  busy: boolean;
  onUpload: (input: { name?: string | null; svg: string }) => Promise<void>;
}

export default function IconUploadInline({ busy, onUpload }: Props) {
  const [svg, setSvg] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const valid = isLikelySvg(svg.trim());

  const submit = async (): Promise<void> => {
    setError(null);
    if (!valid) {
      setError('Pegá un <svg>...</svg> válido.');
      return;
    }
    try {
      await onUpload({ name: name.trim() || null, svg: svg.trim() });
      setSvg('');
      setName('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error subiendo el icono');
    }
  };

  return (
    // bg-bg = mismo card "blanco/oscuro" del resto de la app; así los
    // Input/Textarea/Button del catálogo (que vienen con bg-bg-muted)
    // contrastan adentro y se ven claramente.
    <div className="rounded-xl bg-bg p-4 shadow-sm">
      <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
        Subir nuevo icono
      </p>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre visible (opcional)"
          />
          <Textarea
            value={svg}
            onChange={(e) => setSvg(e.target.value)}
            placeholder="<svg xmlns='http://www.w3.org/2000/svg' ...> ... </svg>"
            spellCheck={false}
            rows={4}
            className="font-mono text-[11.5px]"
          />
        </div>
        <div className="flex flex-col items-center justify-between gap-2 sm:items-end">
          <span
            className={cn(
              'flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-bg-muted text-fg-muted',
              '[&_svg]:h-10 [&_svg]:w-10'
            )}
            dangerouslySetInnerHTML={
              valid ? { __html: normalizeIconSvg(svg.trim()) } : { __html: '' }
            }
          />
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={!valid || busy}
            onClick={submit}
            leftIcon={<PlusIcon width={13} height={13} />}
          >
            Crear
          </Button>
        </div>
      </div>
      {error && <p className="mt-2 text-[12px] text-danger-text">{error}</p>}
    </div>
  );
}
