// Panel de propiedades del bloque seleccionado. Sólo contenido y
// comportamiento — sin color libre ni medidas en px. ID auto y oculto.

import Input from '../../../../shared/components/Input/index.js';
import Textarea from '../../../../shared/components/Textarea/index.js';
import Select from '../../../../shared/components/Select/index.js';
import Switch from '../../../../shared/components/Switch/index.js';
import Button from '../../../../shared/components/Button/index.js';
import InlineIconPicker from './InlineIconPicker.js';
import { PlusIcon, TrashIcon } from '../../../../shared/icons/index.js';
import { getBlockDef, readProp, writeProp } from '../../lib/blockManifest.js';
import type { Block, BlockProps } from '../../types.js';
import type { DesignView } from '../../api.js';

interface Props {
  block: Block;
  views: DesignView[];
  onChangeProps: (next: BlockProps) => void;
  onDelete: () => void;
}

const asString = (v: unknown): string => (typeof v === 'string' ? v : '');
const asList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
const asBool = (v: unknown): boolean => v === true;

export default function PropertiesPanel({
  block,
  views,
  onChangeProps,
  onDelete
}: Props) {
  const def = getBlockDef(block.type);
  if (!def) {
    return (
      <div className="p-4 text-[12px] text-fg-faint">
        Componente desconocido.
      </div>
    );
  }

  const update = (key: string, value: unknown): void => {
    onChangeProps(writeProp(block.props, key, value));
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex shrink-0 items-start justify-between gap-2 px-4 pt-4 pb-2">
        <div className="min-w-0">
          <p className="text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
            Propiedades
          </p>
          <p className="truncate text-[13.5px] font-semibold text-fg">{def.label}</p>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-2">
        <div className="flex flex-1 flex-col gap-4">
          {def.schema.length === 0 && (
            <p className="text-[12px] text-fg-faint">
              Este componente no tiene propiedades editables.
            </p>
          )}

          {def.schema.map((field) => {
            // Fields condicionales: ocultar si la prop "visibleIf" es falsy.
            const visibleIfKey = (field as { visibleIf?: string }).visibleIf;
            if (visibleIfKey && !readProp(block.props, visibleIfKey)) return null;
            const raw = readProp(block.props, field.key);

            if (field.type === 'text') {
              return (
                <Input
                  key={field.key}
                  label={field.label}
                  value={asString(raw)}
                  placeholder={field.placeholder}
                  onChange={(e) => update(field.key, e.target.value)}
                />
              );
            }
            if (field.type === 'textarea') {
              return (
                <Textarea
                  key={field.key}
                  label={field.label}
                  value={asString(raw)}
                  placeholder={field.placeholder}
                  rows={field.rows ?? 4}
                  onChange={(e) => update(field.key, e.target.value)}
                />
              );
            }
            if (field.type === 'option') {
              return (
                <Select
                  key={field.key}
                  label={field.label}
                  value={asString(raw)}
                  onChange={(v) => update(field.key, v ?? '')}
                  options={field.options.map((o) => ({ value: o.value, label: o.label }))}
                  placeholder="Elegir"
                />
              );
            }
            if (field.type === 'bool') {
              return (
                <Switch
                  key={field.key}
                  label={field.label}
                  options={[
                    { value: 'false', label: 'No' },
                    { value: 'true', label: 'Sí' }
                  ]}
                  value={asBool(raw) ? 'true' : 'false'}
                  onChange={(v) => update(field.key, v === 'true')}
                />
              );
            }
            if (field.type === 'list') {
              const items = asList(raw);
              return (
                <div key={field.key} className="flex flex-col gap-1.5">
                  <span className="block text-[12.5px] font-medium text-fg-muted">
                    {field.label}
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {items.map((it, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <Input
                          value={it}
                          placeholder={field.itemLabel ?? 'Elemento'}
                          onChange={(e) => {
                            const next = items.slice();
                            next[i] = e.target.value;
                            update(field.key, next);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const next = items.slice();
                            next.splice(i, 1);
                            update(field.key, next);
                          }}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-fg-faint outline-none hover:bg-bg-muted hover:text-danger-text"
                          title="Quitar"
                        >
                          <TrashIcon width={12} height={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => update(field.key, [...items, ''])}
                    leftIcon={<PlusIcon width={12} height={12} />}
                  >
                    Agregar {field.itemLabel?.toLowerCase() ?? 'elemento'}
                  </Button>
                </div>
              );
            }
            if (field.type === 'view-link') {
              const current =
                typeof raw === 'number' ? raw : raw == null ? null : Number(raw);
              const options = views.map((v) => ({ value: v.id, label: v.name }));
              return (
                <Select
                  key={field.key}
                  label={field.label}
                  value={current}
                  onChange={(v) => update(field.key, v)}
                  options={options}
                  placeholder="Sin acción"
                  hint={field.hint}
                />
              );
            }
            if (field.type === 'icon-picker') {
              const svg = typeof raw === 'string' ? raw : null;
              // No duplicar el header — el panel ya muestra def.label arriba.
              return (
                <div key={field.key} className="flex flex-1 flex-col gap-1.5">
                  <InlineIconPicker
                    value={svg}
                    onChange={(next) => update(field.key, next)}
                  />
                </div>
              );
            }
            return null;
          })}

          {/* Tooltip global: cualquier bloque puede tener un tooltip que se
              muestra al hover en la app real. Toggle + input. */}
          <div className="border-t border-border-subtle pt-3">
            <Switch
              label="Tiene tooltip"
              options={[
                { value: 'no', label: 'No' },
                { value: 'yes', label: 'Sí' }
              ]}
              value={readProp(block.props, 'hasTooltip') ? 'yes' : 'no'}
              onChange={(v) =>
                onChangeProps(writeProp(block.props, 'hasTooltip', v === 'yes'))
              }
            />
            {readProp(block.props, 'hasTooltip') ? (
              <div className="mt-3">
                <Input
                  label="Texto del tooltip"
                  value={asString(readProp(block.props, 'tooltip'))}
                  placeholder="Se muestra al pasar el mouse"
                  onChange={(e) =>
                    onChangeProps(writeProp(block.props, 'tooltip', e.target.value))
                  }
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Botón Eliminar al pie, usando Button del catálogo (variant danger). */}
      <div className="shrink-0 px-4 pb-4 pt-2">
        <Button
          type="button"
          variant="danger"
          size="sm"
          fullWidth
          onClick={onDelete}
          leftIcon={<TrashIcon width={13} height={13} />}
        >
          Eliminar
        </Button>
      </div>
    </div>
  );
}
