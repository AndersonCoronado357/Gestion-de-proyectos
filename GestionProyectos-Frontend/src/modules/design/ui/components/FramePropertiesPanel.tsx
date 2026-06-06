// Propiedades de la VISTA seleccionada. Aparece a la derecha cuando hay
// un frame activo y NO hay bloque seleccionado.
//   - Editar nombre
//   - Marcar como vista inicial
//   - Eliminar (con Alert + Toast)

import { useEffect, useState } from 'react';
import Input from '../../../../shared/components/Input/index.js';
import Button from '../../../../shared/components/Button/index.js';
import Alert from '../../../../shared/components/Alert/index.js';
import { TrashIcon } from '../../../../shared/icons/index.js';
import type { DesignView } from '../../api.js';

interface Props {
  view: DesignView;
  canDelete: boolean;
  onRename: (name: string) => void;
  onDelete: () => void;
}

export default function FramePropertiesPanel({
  view,
  canDelete,
  onRename,
  onDelete
}: Props) {
  const [name, setName] = useState(view.name);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => setName(view.name), [view.id, view.name]);

  const commitName = (): void => {
    const v = name.trim();
    if (!v || v === view.name) {
      setName(view.name);
      return;
    }
    onRename(v);
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="shrink-0 px-4 pt-4 pb-2">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
          Vista
        </p>
        <p className="truncate text-[13.5px] font-semibold text-fg">{view.name}</p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">
        <div className="flex flex-col gap-4">
          <Input
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
            }}
          />

        </div>
      </div>

      <div className="shrink-0 px-4 pb-4 pt-2">
        <Button
          type="button"
          variant="danger"
          size="sm"
          fullWidth
          disabled={!canDelete}
          onClick={() => setConfirm(true)}
          leftIcon={<TrashIcon width={13} height={13} />}
        >
          Eliminar vista
        </Button>
        {!canDelete && (
          <p className="mt-1.5 text-center text-[10.5px] text-fg-faint">
            No podés eliminar la última vista.
          </p>
        )}
      </div>

      {confirm && (
        <Alert
          type="confirm"
          title="Eliminar vista"
          message={`¿Querés eliminar la vista "${view.name}"? Esta acción no se puede deshacer.`}
          confirmText="ELIMINAR"
          cancelText="CANCELAR"
          onConfirm={() => {
            setConfirm(false);
            onDelete();
          }}
          onCancel={() => setConfirm(false)}
          onClose={() => setConfirm(false)}
        />
      )}
    </div>
  );
}
