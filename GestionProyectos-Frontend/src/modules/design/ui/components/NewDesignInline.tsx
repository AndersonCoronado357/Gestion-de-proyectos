// Caja inline para crear un nuevo proyecto del Diseñador. Mismo patrón que
// IconUploadInline pero más simple: un Input + botón "Crear" en una fila.

import { useState } from 'react';
import Input from '../../../../shared/components/Input/index.js';
import Button from '../../../../shared/components/Button/index.js';
import { PlusIcon } from '../../../../shared/icons/index.js';

interface Props {
  busy: boolean;
  onCreate: (name: string) => Promise<void>;
}

export default function NewDesignInline({ busy, onCreate }: Props) {
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (): Promise<void> => {
    const n = name.trim();
    if (!n) {
      setError('Ponle un nombre al diseño.');
      return;
    }
    setError(null);
    try {
      await onCreate(n);
      setName('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear');
    }
  };

  return (
    <div className="rounded-xl bg-bg p-4 shadow-sm">
      <p className="mb-3 text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
        Nuevo diseño
      </p>
      <div className="flex flex-wrap items-start gap-2">
        <div className="min-w-[220px] flex-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void submit();
            }}
            placeholder="Nombre del diseño"
          />
        </div>
        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={busy || !name.trim()}
          onClick={submit}
          leftIcon={<PlusIcon width={13} height={13} />}
        >
          Crear
        </Button>
      </div>
      {error && <p className="mt-2 text-[12px] text-danger-text">{error}</p>}
    </div>
  );
}
