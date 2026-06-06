// Barra superior del editor: volver al hub, nombre del proyecto editable,
// botón "+ Vista", status de autoguardado, "Vista previa" (mismo tab).

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../../../../shared/components/Button/index.js';
import { EyeIcon, PlusIcon } from '../../../../shared/icons/index.js';

interface Props {
  name: string;
  onRename: (next: string) => void;
  saving: boolean;
  savedAt: number | null;
  projectId: number;
  onAddView: () => void | Promise<void>;
  onBack: () => void;
}

function relTime(ts: number | null): string {
  if (!ts) return '';
  const diff = Math.max(0, Date.now() - ts);
  if (diff < 4_000) return 'Guardado';
  if (diff < 60_000) return `Guardado hace ${Math.floor(diff / 1000)} s`;
  return `Guardado hace ${Math.floor(diff / 60_000)} min`;
}

export default function EditorTopBar({
  name,
  onRename,
  saving,
  savedAt,
  projectId,
  onAddView,
  onBack
}: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [, force] = useState(0);

  useEffect(() => {
    setValue(name);
  }, [name]);

  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 5_000);
    return () => clearInterval(t);
  }, []);

  const commit = (): void => {
    const v = value.trim();
    setEditing(false);
    if (v && v !== name) onRename(v);
    else setValue(name);
  };

  return (
    <div className="flex h-12 shrink-0 items-center gap-3 bg-bg px-3 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[12px] text-fg-muted outline-none transition-colors hover:bg-bg-muted hover:text-fg"
      >
        ← Volver
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        {editing ? (
          <input
            ref={inputRef}
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') {
                setValue(name);
                setEditing(false);
              }
            }}
            className="h-7 min-w-[160px] rounded-md bg-bg-muted px-2 text-[13px] font-semibold text-fg outline-none"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            title="Renombrar"
            className="truncate rounded-md px-2 py-1 text-[13.5px] font-semibold text-fg outline-none transition-colors hover:bg-bg-muted"
          >
            {name}
          </button>
        )}
        <span className="text-[11px] text-fg-faint">
          {saving ? 'Guardando…' : relTime(savedAt)}
        </span>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => void onAddView()}
        leftIcon={<PlusIcon width={12} height={12} />}
      >
        Nueva vista
      </Button>

      <Link to={`/administracion/diseno/${projectId}/preview`}>
        <Button
          type="button"
          variant="primary"
          size="sm"
          leftIcon={<EyeIcon width={13} height={13} />}
        >
          Vista previa
        </Button>
      </Link>
    </div>
  );
}
