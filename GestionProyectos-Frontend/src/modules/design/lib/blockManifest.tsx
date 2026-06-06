// Catálogo de bloques. UN componente = UNA instancia (NO demos con datos
// pre-cargados). Visual idéntico a /administracion/componentes pero acá
// se inserta solo en su forma básica vacía — los datos / opciones se
// configuran por bloque desde el panel de propiedades.

import type { ReactNode } from 'react';
import Input from '../../../shared/components/Input/index.js';
import Textarea from '../../../shared/components/Textarea/index.js';
import Button from '../../../shared/components/Button/index.js';
import Select from '../../../shared/components/Select/index.js';
import Badge from '../../../shared/components/Badge/index.js';
import LevelChip, { type Level } from '../../../shared/components/LevelChip/index.js';
import TagChip from '../../../shared/components/TagChip/index.js';
import FilterChip from '../../../shared/components/FilterChip/index.js';
import Switch from '../../../shared/components/Switch/index.js';
import Checkbox from '../../../shared/components/Checkbox/index.js';
import Avatar from '../../../shared/components/Avatar/index.js';
import Accordion from '../../../shared/components/Accordion/index.js';
import Tabs from '../../../shared/components/Tabs/index.js';
import Stepper from '../../../shared/components/Stepper/index.js';
import ProgressBar from '../../../shared/components/ProgressBar/index.js';
import SearchInput from '../../../shared/components/SearchInput/index.js';
import DateInput from '../../../shared/components/DateInput/index.js';
import ColorPicker from '../../../shared/components/ColorPicker/index.js';
import EmptyState from '../../../shared/components/EmptyState/index.js';
import Loader from '../../../shared/components/Loader/index.js';
import Skeleton from '../../../shared/components/Skeleton/index.js';
import Tooltip from '../../../shared/components/Tooltip/index.js';
import SimpleTable from '../../../shared/components/SimpleTable/index.js';
import {
  InteractiveSelect,
  InteractiveCheckbox,
  InteractiveSwitch,
  InteractiveInput,
  InteractiveTextarea,
  InteractiveSearch,
  InteractiveDate,
  InteractiveColor
} from './interactiveWrappers.js';
import DataTable from '../../../shared/components/DataTable/index.js';
import {
  BarChart,
  LineChart,
  DonutChart,
  Sparkline
} from '../../../shared/components/Charts/index.js';
import { normalizeIconSvg } from '../../icons/ui/lib/normalizeIconSvg.js';
import type { Block, BlockProps } from '../types.js';

export interface PropFieldText {
  key: string;
  label: string;
  type: 'text';
  placeholder?: string;
  /** Sólo mostrar este field si la prop indicada es truthy. */
  visibleIf?: string;
}
export interface PropFieldTextarea {
  key: string;
  label: string;
  type: 'textarea';
  placeholder?: string;
  rows?: number;
}
export interface PropFieldList {
  key: string;
  label: string;
  type: 'list';
  itemLabel?: string;
}
export interface PropFieldViewLink {
  key: string;
  label: string;
  type: 'view-link';
  hint?: string;
}
export interface PropFieldOption {
  key: string;
  label: string;
  type: 'option';
  options: ReadonlyArray<{ value: string; label: string }>;
}
export interface PropFieldIconPicker {
  key: string;
  label: string;
  type: 'icon-picker';
}
export interface PropFieldBool {
  key: string;
  label: string;
  type: 'bool';
}
export type PropField =
  | PropFieldText
  | PropFieldTextarea
  | PropFieldList
  | PropFieldViewLink
  | PropFieldOption
  | PropFieldIconPicker
  | PropFieldBool;

export interface BlockRenderCtx {
  onNavigate?: (viewId: number) => void;
  isEditing?: boolean;
}

/** Qué ejes puede cambiar el usuario arrastrando el handle del bloque. */
export type BlockResize = 'both' | 'width' | 'height' | 'none';

export interface BlockDef {
  type: string;
  label: string;
  group: 'Acción' | 'Texto' | 'Formulario' | 'Datos' | 'Feedback' | 'Estructura';
  defaultSize: { w: number; h: number };
  defaultProps: BlockProps;
  schema: PropField[];
  render: (props: BlockProps, ctx: BlockRenderCtx) => ReactNode;
  /** Política de resize del bloque. Default 'both'. */
  resize?: BlockResize;
}

const str = (v: unknown, fb = ''): string => (typeof v === 'string' ? v : fb);
const asStringList = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
const asBool = (v: unknown): boolean => v === true;

// ── Acción ───────────────────────────────────────────────────────────
const BUTTON: BlockDef = {
  type: 'button',
  label: 'Botón',
  group: 'Acción',
  // El botón es de alto FIJO (= 32px, alto natural del componente con
  // size="sm" — coincide con el uso típico en los módulos de la app).
  // Solo se puede ajustar el ancho.
  resize: 'width',
  defaultSize: { w: 120, h: 32 },
  defaultProps: { label: 'Botón', variant: 'primary' },
  schema: [{ key: 'label', label: 'Etiqueta', type: 'text' }],
  render: (props) => {
    const variant = str(props.variant, 'primary') as
      | 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'warning'
      | 'outline-primary' | 'outline-danger';
    return (
      <Button type="button" variant={variant} size="sm" fullWidth>
        {str(props.label, 'Botón')}
      </Button>
    );
  }
};

const ICON: BlockDef = {
  type: 'icon',
  label: 'Icono',
  group: 'Acción',
  resize: 'both',
  defaultSize: { w: 32, h: 32 },
  defaultProps: { svg: null },
  schema: [{ key: 'svg', label: 'Icono', type: 'icon-picker' }],
  render: (props) => {
    const raw = typeof props.svg === 'string' ? props.svg : null;
    if (!raw) {
      return (
        <div className="flex h-full w-full items-center justify-center text-[10px] text-fg-faint">
          (icono)
        </div>
      );
    }
    return (
      <span
        className="flex h-full w-full items-center justify-center text-fg-muted [&_svg]:h-full [&_svg]:w-full"
        dangerouslySetInnerHTML={{ __html: normalizeIconSvg(raw) }}
      />
    );
  }
};

// ── Formulario ───────────────────────────────────────────────────────
const INPUT_FIELD: BlockDef = {
  type: 'input',
  label: 'Input',
  group: 'Formulario',
  resize: 'width',
  // SIN etiqueta: alto = solo el input (~38px). Si el user activa la
  // etiqueta, debe ampliar el alto manualmente (o usar resize).
  defaultSize: { w: 260, h: 38 },
  defaultProps: { hasLabel: false, label: '', placeholder: '' },
  schema: [
    { key: 'hasLabel', label: 'Mostrar etiqueta', type: 'bool' },
    { key: 'label', label: 'Etiqueta', type: 'text', visibleIf: 'hasLabel' },
    { key: 'placeholder', label: 'Texto guía', type: 'text' }
  ],
  render: (props, ctx) => (
    <div className="flex h-full w-full flex-col justify-start">
      <InteractiveInput
        label={props.hasLabel ? str(props.label) : undefined}
        placeholder={str(props.placeholder)}
        isEditing={ctx.isEditing}
      />
    </div>
  )
};

const TEXTAREA_FIELD: BlockDef = {
  type: 'textarea',
  label: 'Textarea',
  group: 'Formulario',
  resize: 'both',
  defaultSize: { w: 300, h: 110 },
  defaultProps: { hasLabel: false, label: '', placeholder: '' },
  schema: [
    { key: 'hasLabel', label: 'Mostrar etiqueta', type: 'bool' },
    { key: 'label', label: 'Etiqueta', type: 'text', visibleIf: 'hasLabel' },
    { key: 'placeholder', label: 'Texto guía', type: 'text' }
  ],
  render: (props, ctx) => (
    <div className="flex h-full w-full flex-col">
      <InteractiveTextarea
        label={props.hasLabel ? str(props.label) : undefined}
        placeholder={str(props.placeholder)}
        isEditing={ctx.isEditing}
        wrapperClassName="flex min-h-0 flex-1 flex-col"
        className="h-full resize-none"
      />
    </div>
  )
};

const SELECT_FIELD: BlockDef = {
  type: 'select',
  label: 'Select',
  group: 'Formulario',
  resize: 'width',
  defaultSize: { w: 260, h: 38 },
  defaultProps: { hasLabel: false, label: '', options: [] },
  schema: [
    { key: 'hasLabel', label: 'Mostrar etiqueta', type: 'bool' },
    { key: 'label', label: 'Etiqueta', type: 'text', visibleIf: 'hasLabel' },
    { key: 'options', label: 'Opciones', type: 'list', itemLabel: 'Opción' }
  ],
  render: (props, ctx) => {
    const options = asStringList(props.options).map((o) => ({ value: o, label: o }));
    return (
      <div className="flex h-full w-full flex-col justify-start">
        <InteractiveSelect
          label={props.hasLabel ? str(props.label) : undefined}
          options={options}
          isEditing={ctx.isEditing}
        />
      </div>
    );
  }
};

const SEARCH_BLOCK: BlockDef = {
  type: 'search-input',
  label: 'Buscador',
  group: 'Formulario',
  resize: 'width',
  defaultSize: { w: 260, h: 36 },
  defaultProps: { placeholder: 'Buscar...' },
  schema: [{ key: 'placeholder', label: 'Texto guía', type: 'text' }],
  render: (props, ctx) => (
    <div className="flex h-full w-full items-center">
      <InteractiveSearch
        placeholder={str(props.placeholder, 'Buscar...')}
        isEditing={ctx.isEditing}
      />
    </div>
  )
};

const DATE_BLOCK: BlockDef = {
  type: 'date-input',
  label: 'Fecha',
  group: 'Formulario',
  resize: 'width',
  defaultSize: { w: 220, h: 38 },
  defaultProps: { hasLabel: false, label: '' },
  schema: [
    { key: 'hasLabel', label: 'Mostrar etiqueta', type: 'bool' },
    { key: 'label', label: 'Etiqueta', type: 'text', visibleIf: 'hasLabel' }
  ],
  render: (props, ctx) => (
    <div className="flex h-full w-full flex-col justify-start">
      <InteractiveDate
        label={props.hasLabel ? str(props.label) : undefined}
        isEditing={ctx.isEditing}
      />
    </div>
  )
};

const COLOR_BLOCK: BlockDef = {
  type: 'color-picker',
  label: 'Color',
  group: 'Formulario',
  resize: 'width',
  defaultSize: { w: 200, h: 50 },
  defaultProps: { value: '#295072' },
  schema: [{ key: 'value', label: 'Color (hex)', type: 'text' }],
  render: (props, ctx) => (
    <div className="flex h-full w-full items-center">
      <InteractiveColor
        initial={str(props.value, '#295072')}
        isEditing={ctx.isEditing}
      />
    </div>
  )
};

const SWITCH_FIELD: BlockDef = {
  type: 'switch',
  label: 'Switch',
  group: 'Formulario',
  resize: 'width',
  defaultSize: { w: 220, h: 40 },
  defaultProps: { options: ['Sí', 'No'], value: 'Sí' },
  schema: [{ key: 'options', label: 'Opciones', type: 'list', itemLabel: 'Opción' }],
  render: (props, ctx) => {
    const opts = asStringList(props.options).map((o) => ({ value: o, label: o }));
    const v = str(props.value, opts[0]?.value ?? '');
    return (
      <div className="flex h-full w-full items-center">
        <InteractiveSwitch options={opts} initial={v} isEditing={ctx.isEditing} />
      </div>
    );
  }
};

const CHECKBOX_FIELD: BlockDef = {
  type: 'checkbox',
  label: 'Checkbox',
  group: 'Formulario',
  resize: 'width',
  defaultSize: { w: 180, h: 24 },
  defaultProps: { label: 'Opción', checked: false },
  schema: [
    { key: 'label', label: 'Etiqueta', type: 'text' },
    { key: 'checked', label: 'Marcado', type: 'bool' }
  ],
  render: (props, ctx) => (
    <div className="flex h-full w-full items-center">
      <InteractiveCheckbox
        initial={asBool(props.checked)}
        label={str(props.label, 'Opción')}
        isEditing={ctx.isEditing}
      />
    </div>
  )
};

// ── Chips / Indicadores ──────────────────────────────────────────────
const BADGE: BlockDef = {
  type: 'badge',
  label: 'Badge',
  group: 'Estructura',
  resize: 'width',
  defaultSize: { w: 80, h: 22 },
  defaultProps: { text: 'Badge', variant: 'primary' },
  schema: [
    { key: 'text', label: 'Texto', type: 'text' },
    {
      key: 'variant',
      label: 'Color',
      type: 'option',
      options: [
        { value: 'neutral', label: 'Neutral' },
        { value: 'primary', label: 'Primario' },
        { value: 'success', label: 'Éxito' },
        { value: 'warning', label: 'Advertencia' },
        { value: 'danger', label: 'Peligro' }
      ]
    }
  ],
  render: (props) => (
    <div className="flex h-full w-full items-center">
      <Badge
        variant={str(props.variant, 'primary') as 'neutral' | 'primary' | 'success' | 'warning' | 'danger'}
        size="md"
        className="w-full justify-center"
      >
        {str(props.text, 'Badge')}
      </Badge>
    </div>
  )
};

const LEVEL_CHIP: BlockDef = {
  type: 'level-chip',
  label: 'Chip de nivel',
  group: 'Estructura',
  resize: 'width',
  defaultSize: { w: 90, h: 22 },
  defaultProps: { level: 'info' },
  schema: [
    {
      key: 'level',
      label: 'Nivel',
      type: 'option',
      options: [
        { value: 'error', label: 'Error' },
        { value: 'warn', label: 'Advertencia' },
        { value: 'info', label: 'Info' },
        { value: 'debug', label: 'Debug' },
        { value: 'audit', label: 'Auditoría' },
        { value: 'success', label: 'OK' }
      ]
    }
  ],
  render: (props) => (
    <div className="flex h-full w-full items-center">
      <span className="w-full [&_>_*]:w-full [&_>_*]:justify-center">
        <LevelChip level={str(props.level, 'info') as Level} size="md" />
      </span>
    </div>
  )
};

const TAG_CHIP: BlockDef = {
  type: 'tag-chip',
  label: 'Chip neutro',
  group: 'Estructura',
  resize: 'width',
  defaultSize: { w: 90, h: 22 },
  defaultProps: { text: 'Tag' },
  schema: [{ key: 'text', label: 'Texto', type: 'text' }],
  render: (props) => (
    <div className="flex h-full w-full items-center">
      <TagChip size="md" className="w-full justify-center">
        {str(props.text, 'Tag')}
      </TagChip>
    </div>
  )
};

const FILTER_CHIP: BlockDef = {
  type: 'filter-chip',
  label: 'Chip de filtro',
  group: 'Estructura',
  resize: 'width',
  defaultSize: { w: 110, h: 30 },
  defaultProps: { text: 'Filtro', active: false, variant: 'primary' },
  schema: [
    { key: 'text', label: 'Texto', type: 'text' },
    { key: 'active', label: 'Activo', type: 'bool' },
    {
      key: 'variant',
      label: 'Color',
      type: 'option',
      options: [
        { value: 'neutral', label: 'Neutral' },
        { value: 'primary', label: 'Primario' },
        { value: 'success', label: 'Éxito' },
        { value: 'warning', label: 'Advertencia' },
        { value: 'danger', label: 'Peligro' }
      ]
    }
  ],
  render: (props) => (
    <div className="flex h-full w-full items-center [&_>_*]:w-full [&_>_*]:justify-center">
      <FilterChip
        active={asBool(props.active)}
        onClick={() => {}}
        variant={str(props.variant, 'primary') as 'neutral' | 'primary' | 'success' | 'warning' | 'danger'}
      >
        {str(props.text, 'Filtro')}
      </FilterChip>
    </div>
  )
};

const AVATAR: BlockDef = {
  type: 'avatar',
  label: 'Avatar',
  group: 'Estructura',
  resize: 'both',
  defaultSize: { w: 56, h: 56 },
  defaultProps: { name: '' },
  schema: [{ key: 'name', label: 'Nombre', type: 'text' }],
  render: (props) => {
    // Avatar adaptado: círculo que ocupa min(w, h) del bloque.
    const initial = (str(props.name).trim()[0] ?? '?').toUpperCase();
    return (
      <div className="flex h-full w-full items-center justify-center overflow-hidden">
        <span className="flex aspect-square h-full max-h-full max-w-full items-center justify-center rounded-full bg-primary font-semibold text-on-primary">
          <span style={{ fontSize: 'calc(min(100%, 100%) * 0.4)' }}>{initial}</span>
        </span>
      </div>
    );
  }
};

// ── Estructura / navegación ──────────────────────────────────────────
const TABS_BLOCK: BlockDef = {
  type: 'tabs',
  label: 'Tabs',
  group: 'Estructura',
  resize: 'width',
  defaultSize: { w: 340, h: 40 },
  defaultProps: { items: ['Pestaña'] },
  schema: [{ key: 'items', label: 'Pestañas', type: 'list', itemLabel: 'Pestaña' }],
  render: (props) => {
    const items = asStringList(props.items).map((label, i) => ({
      id: `tab-${i}`,
      label,
      content: null as unknown as ReactNode
    }));
    return <Tabs items={items} />;
  }
};

const ACCORDION_BLOCK: BlockDef = {
  type: 'accordion',
  label: 'Acordeón',
  group: 'Estructura',
  resize: 'both',
  defaultSize: { w: 340, h: 90 },
  defaultProps: { items: ['Sección'] },
  schema: [{ key: 'items', label: 'Secciones', type: 'list', itemLabel: 'Título' }],
  render: (props) => {
    const items = asStringList(props.items).map((title, i) => ({
      id: `sec-${i}`,
      title,
      content: <span className="text-[12.5px] text-fg-muted">Contenido</span>
    }));
    return <Accordion items={items} />;
  }
};

const STEPPER_BLOCK: BlockDef = {
  type: 'stepper',
  label: 'Stepper',
  group: 'Estructura',
  resize: 'width',
  defaultSize: { w: 360, h: 80 },
  defaultProps: { steps: ['Paso'], current: 0 },
  schema: [
    { key: 'steps', label: 'Pasos', type: 'list', itemLabel: 'Paso' },
    { key: 'current', label: 'Paso actual (0..)', type: 'text' }
  ],
  render: (props) => {
    const steps = asStringList(props.steps).map((label) => ({ label }));
    const current = Number(props.current) || 0;
    return <Stepper steps={steps} current={current} />;
  }
};

// ── Datos ────────────────────────────────────────────────────────────
const TABLE: BlockDef = {
  type: 'table',
  label: 'Tabla simple',
  group: 'Datos',
  resize: 'both',
  defaultSize: { w: 480, h: 200 },
  defaultProps: { columns: ['Columna'] },
  schema: [{ key: 'columns', label: 'Columnas', type: 'list', itemLabel: 'Columna' }],
  render: (props) => {
    const cols = asStringList(props.columns);
    const simpleCols = cols.map((label, i) => ({
      id: `c${i}`,
      label,
      render: () => '—'
    }));
    return (
      <div className="h-full w-full">
        <SimpleTable data={[]} columns={simpleCols} initialPageSize={5} />
      </div>
    );
  }
};

const DATA_TABLE: BlockDef = {
  type: 'data-table',
  label: 'Tabla con filtros',
  group: 'Datos',
  resize: 'both',
  defaultSize: { w: 560, h: 320 },
  defaultProps: { columns: ['Columna'] },
  schema: [{ key: 'columns', label: 'Columnas', type: 'list', itemLabel: 'Columna' }],
  render: (props) => {
    // DataTable real, con filter:'select' en la primer columna para que se
    // vea el Select2 (buscador + filtro) en la cabecera del bloque.
    const colsRaw = asStringList(props.columns);
    const cols = colsRaw.map((label, i) => ({
      id: `c${i}`,
      label,
      accessor: (_r: unknown) => '—',
      ...(i === 0 ? { filter: 'select' as const } : {})
    }));
    return (
      <div className="h-full w-full">
        <DataTable data={[]} columns={cols} initialPageSize={5} />
      </div>
    );
  }
};

// ── Estructura: Contenedor en blanco ────────────────────────────────
// "Div" blanco con sombra + rounded del tema, base para agrupar bloques.
const CONTAINER: BlockDef = {
  type: 'container',
  label: 'Contenedor',
  group: 'Estructura',
  resize: 'both',
  defaultSize: { w: 360, h: 200 },
  defaultProps: { radius: 'md' },
  schema: [
    {
      key: 'radius',
      label: 'Redondeo',
      type: 'option',
      options: [
        { value: 'md', label: 'Normal' },
        { value: 'lg', label: 'Grande' },
        { value: 'xl', label: 'Extra grande' },
        { value: '2xl', label: '2X grande' }
      ]
    }
  ],
  render: (props) => {
    const r = str(props.radius, 'md');
    const cls =
      r === '2xl' ? 'rounded-2xl' : r === 'xl' ? 'rounded-xl' : r === 'lg' ? 'rounded-lg' : 'rounded-md';
    return <div className={`h-full w-full bg-bg shadow-sm ${cls}`} />;
  }
};

// ── Feedback ─────────────────────────────────────────────────────────
const PROGRESS_BLOCK: BlockDef = {
  type: 'progress',
  label: 'Barra de progreso',
  group: 'Feedback',
  resize: 'width',
  defaultSize: { w: 280, h: 24 },
  defaultProps: { value: 0, showLabel: false },
  schema: [
    { key: 'value', label: 'Valor (0–100)', type: 'text' },
    { key: 'showLabel', label: 'Mostrar texto', type: 'bool' }
  ],
  render: (props) => {
    const value = Math.max(0, Math.min(100, Number(props.value) || 0));
    return (
      <div className="flex h-full w-full items-center">
        <ProgressBar value={value} showLabel={asBool(props.showLabel)} />
      </div>
    );
  }
};

const LOADER_BLOCK: BlockDef = {
  type: 'loader',
  label: 'Loader',
  group: 'Feedback',
  resize: 'none',
  defaultSize: { w: 120, h: 50 },
  defaultProps: { label: '' },
  schema: [{ key: 'label', label: 'Texto', type: 'text' }],
  render: (props) => (
    <div className="flex h-full w-full items-center justify-center">
      <Loader label={str(props.label)} />
    </div>
  )
};

const SKELETON_BLOCK: BlockDef = {
  type: 'skeleton',
  label: 'Skeleton',
  group: 'Feedback',
  resize: 'both',
  defaultSize: { w: 200, h: 16 },
  defaultProps: { variant: 'rect' },
  schema: [
    {
      key: 'variant',
      label: 'Forma',
      type: 'option',
      options: [
        { value: 'rect', label: 'Rectángulo' },
        { value: 'circle', label: 'Círculo' },
        { value: 'text', label: 'Texto' }
      ]
    }
  ],
  render: (props) => {
    const variant = str(props.variant, 'rect') as 'rect' | 'circle' | 'text';
    return <Skeleton variant={variant} width="100%" height="100%" />;
  }
};

const EMPTY_STATE_BLOCK: BlockDef = {
  type: 'empty-state',
  label: 'Estado vacío',
  group: 'Feedback',
  resize: 'both',
  defaultSize: { w: 320, h: 160 },
  defaultProps: { title: 'Sin datos', description: '' },
  schema: [
    { key: 'title', label: 'Título', type: 'text' },
    { key: 'description', label: 'Descripción', type: 'text' }
  ],
  render: (props) => (
    <div className="flex h-full w-full items-center justify-center">
      <EmptyState title={str(props.title, 'Sin datos')} description={str(props.description)} />
    </div>
  )
};

const TOOLTIP_BLOCK: BlockDef = {
  type: 'tooltip',
  label: 'Tooltip',
  group: 'Feedback',
  resize: 'none',
  defaultSize: { w: 180, h: 32 },
  defaultProps: { trigger: 'Pasar el mouse', content: 'Tooltip' },
  schema: [
    { key: 'trigger', label: 'Texto base', type: 'text' },
    { key: 'content', label: 'Contenido', type: 'text' }
  ],
  render: (props) => (
    <div className="flex h-full w-full items-center justify-center">
      <Tooltip content={str(props.content, 'Tooltip')}>
        <span className="inline-flex items-center rounded-md bg-bg-muted px-2 py-1 text-[12px] text-fg-muted">
          {str(props.trigger, 'Pasar el mouse')}
        </span>
      </Tooltip>
    </div>
  )
};

const CHART_BAR: BlockDef = {
  type: 'chart-bar',
  label: 'Gráfica de barras',
  group: 'Datos',
  resize: 'both',
  defaultSize: { w: 480, h: 280 },
  defaultProps: { labels: ['A', 'B', 'C', 'D'], values: [32, 24, 41, 18] },
  schema: [
    { key: 'labels', label: 'Categorías', type: 'list', itemLabel: 'Etiqueta' }
  ],
  render: (props) => {
    const labels = asStringList(props.labels);
    const vals = Array.isArray(props.values) ? (props.values as number[]) : [];
    const data = labels.map((label, i) => ({ label, value: Number(vals[i]) || 0 }));
    // `!h-full` anula el `style={{ height }}` inline del wrapper interno
    // del BarChart → Chart.js mide el ALTO REAL del bloque (no 300 default).
    return <BarChart data={data} className="!h-full" />;
  }
};

const CHART_LINE: BlockDef = {
  type: 'chart-line',
  label: 'Gráfica de líneas',
  group: 'Datos',
  resize: 'both',
  defaultSize: { w: 480, h: 280 },
  defaultProps: { labels: ['L', 'M', 'X', 'J', 'V'] },
  schema: [{ key: 'labels', label: 'Etiquetas eje X', type: 'list', itemLabel: 'Etiqueta' }],
  render: (props) => {
    const labels = asStringList(props.labels);
    const series = [{ label: 'Serie', points: labels.map((_, i) => 5 + ((i * 7) % 20)) }];
    return <LineChart series={series} labels={labels} area className="!h-full" />;
  }
};

const CHART_DONUT: BlockDef = {
  type: 'chart-donut',
  label: 'Gráfica donut',
  group: 'Datos',
  resize: 'both',
  defaultSize: { w: 360, h: 280 },
  defaultProps: { labels: ['A', 'B', 'C'], values: [45, 30, 25] },
  schema: [{ key: 'labels', label: 'Categorías', type: 'list', itemLabel: 'Etiqueta' }],
  render: (props) => {
    const labels = asStringList(props.labels);
    const vals = Array.isArray(props.values) ? (props.values as number[]) : [];
    const data = labels.map((label, i) => ({ label, value: Number(vals[i]) || 1 }));
    return (
      <div className="relative h-full w-full">
        <div className="absolute inset-0 [&>*]:!h-full">
          <DonutChart data={data} />
        </div>
      </div>
    );
  }
};

const CHART_SPARKLINE: BlockDef = {
  type: 'chart-sparkline',
  label: 'Sparkline',
  group: 'Datos',
  resize: 'width',
  defaultSize: { w: 200, h: 40 },
  defaultProps: { points: [4, 6, 5, 8, 7, 10, 9, 12] },
  schema: [],
  render: (props) => {
    const points = Array.isArray(props.points)
      ? (props.points as number[]).filter((n) => typeof n === 'number')
      : [];
    return (
      <div className="flex h-full w-full items-center">
        <Sparkline points={points} height={Math.min(40, 40)} />
      </div>
    );
  }
};

export const BLOCK_DEFS: BlockDef[] = [
  BUTTON, ICON,
  INPUT_FIELD, TEXTAREA_FIELD, SELECT_FIELD, SEARCH_BLOCK, DATE_BLOCK, COLOR_BLOCK,
  SWITCH_FIELD, CHECKBOX_FIELD,
  CONTAINER,
  BADGE, LEVEL_CHIP, TAG_CHIP, FILTER_CHIP, AVATAR,
  TABS_BLOCK, ACCORDION_BLOCK, STEPPER_BLOCK,
  TABLE, DATA_TABLE,
  CHART_BAR, CHART_LINE, CHART_DONUT, CHART_SPARKLINE,
  PROGRESS_BLOCK, EMPTY_STATE_BLOCK, TOOLTIP_BLOCK,
  // LOADER y SKELETON se quedan en BLOCK_DEFS por si hay vistas viejas
  // que los referencien, pero NO los exponemos en PRESETS (son globales).
  LOADER_BLOCK, SKELETON_BLOCK
];

// ── PRESETS ──────────────────────────────────────────────────────────
// Cada preset es una entrada de panel: un BlockDef + overrides de
// defaultProps + tamaño + etiqueta. Así el panel puede mostrar las
// variantes (Botón primario, secundario, peligro, etc.) como entries
// independientes — pero todos comparten el render del BlockDef base.

export interface Preset {
  id: string;
  label: string;
  group: BlockDef['group'];
  type: string;        // BlockDef.type
  defaultProps?: BlockProps;
  defaultSize?: { w: number; h: number };
}

function mergeProps(base: BlockProps, extra?: BlockProps): BlockProps {
  if (!extra) return structuredClone(base);
  return { ...structuredClone(base), ...extra };
}

const BUTTON_VARIANTS: Array<[string, string]> = [
  ['primary', 'Botón primario'],
  ['secondary', 'Botón secundario'],
  ['ghost', 'Botón ghost'],
  ['danger', 'Botón peligro'],
  ['success', 'Botón éxito'],
  ['warning', 'Botón advertencia'],
  ['outline-primary', 'Botón contorno'],
  ['outline-danger', 'Botón contorno peligro']
];

const BADGE_VARIANTS: Array<[string, string]> = [
  ['neutral', 'Badge neutral'],
  ['primary', 'Badge primario'],
  ['success', 'Badge éxito'],
  ['warning', 'Badge advertencia'],
  ['danger', 'Badge peligro']
];

const LEVEL_VARIANTS: Array<[string, string]> = [
  ['error', 'Nivel error'],
  ['warn', 'Nivel advertencia'],
  ['info', 'Nivel info'],
  ['debug', 'Nivel debug'],
  ['audit', 'Nivel auditoría'],
  ['success', 'Nivel ok']
];

const FILTER_VARIANTS: Array<[string, string]> = [
  ['primary', 'Filtro primario'],
  ['success', 'Filtro éxito'],
  ['warning', 'Filtro advertencia'],
  ['danger', 'Filtro peligro'],
  ['neutral', 'Filtro neutral']
];

export const PRESETS: Preset[] = [
  // Acción — botones variantes
  ...BUTTON_VARIANTS.map(([v, label]) => ({
    id: `button-${v}`,
    label,
    group: 'Acción' as const,
    type: 'button',
    defaultProps: { label: 'Botón', variant: v, action: { navigateToViewId: null } }
  })),
  { id: 'icon', label: 'Icono', group: 'Acción', type: 'icon' },
  // Formulario
  { id: 'input', label: 'Input', group: 'Formulario', type: 'input' },
  { id: 'textarea', label: 'Textarea', group: 'Formulario', type: 'textarea' },
  { id: 'select', label: 'Select', group: 'Formulario', type: 'select' },
  { id: 'search-input', label: 'Buscador', group: 'Formulario', type: 'search-input' },
  { id: 'date-input', label: 'Fecha', group: 'Formulario', type: 'date-input' },
  { id: 'color-picker', label: 'Color', group: 'Formulario', type: 'color-picker' },
  { id: 'switch', label: 'Switch', group: 'Formulario', type: 'switch' },
  { id: 'checkbox', label: 'Checkbox', group: 'Formulario', type: 'checkbox' },
  // Estructura — chips variantes
  ...BADGE_VARIANTS.map(([v, label]) => ({
    id: `badge-${v}`,
    label,
    group: 'Estructura' as const,
    type: 'badge',
    defaultProps: { text: 'Badge', variant: v }
  })),
  ...LEVEL_VARIANTS.map(([v, label]) => ({
    id: `level-${v}`,
    label,
    group: 'Estructura' as const,
    type: 'level-chip',
    defaultProps: { level: v }
  })),
  { id: 'tag-chip', label: 'Chip neutro', group: 'Estructura', type: 'tag-chip' },
  ...FILTER_VARIANTS.map(([v, label]) => ({
    id: `filter-${v}`,
    label,
    group: 'Estructura' as const,
    type: 'filter-chip',
    defaultProps: { text: 'Filtro', active: false, variant: v }
  })),
  { id: 'avatar', label: 'Avatar', group: 'Estructura', type: 'avatar' },
  { id: 'container', label: 'Contenedor', group: 'Estructura', type: 'container' },
  { id: 'tabs', label: 'Tabs', group: 'Estructura', type: 'tabs' },
  { id: 'accordion', label: 'Acordeón', group: 'Estructura', type: 'accordion' },
  { id: 'stepper', label: 'Stepper', group: 'Estructura', type: 'stepper' },
  // Datos
  { id: 'table', label: 'Tabla simple', group: 'Datos', type: 'table' },
  { id: 'data-table', label: 'Tabla con filtros', group: 'Datos', type: 'data-table' },
  { id: 'chart-bar', label: 'Gráfica barras', group: 'Datos', type: 'chart-bar' },
  { id: 'chart-line', label: 'Gráfica líneas', group: 'Datos', type: 'chart-line' },
  { id: 'chart-donut', label: 'Gráfica donut', group: 'Datos', type: 'chart-donut' },
  { id: 'chart-sparkline', label: 'Sparkline', group: 'Datos', type: 'chart-sparkline' },
  // Feedback (sin Loader / Skeleton — son globales, no se ponen por bloque).
  { id: 'progress', label: 'Barra de progreso', group: 'Feedback', type: 'progress' },
  { id: 'empty-state', label: 'Estado vacío', group: 'Feedback', type: 'empty-state' }
  // Tooltip ya no es un componente arrastrable — se agrega como prop al
  // bloque seleccionado desde el panel derecho.
];

export function getPreset(id: string): Preset | undefined {
  return PRESETS.find((p) => p.id === id);
}

/** Instancia un bloque desde un preset. */
export function instantiateFromPreset(preset: Preset, x: number, y: number): Block | null {
  const def = BY_TYPE[preset.type];
  if (!def) return null;
  const size = preset.defaultSize ?? def.defaultSize;
  return {
    id: crypto.randomUUID(),
    type: preset.type,
    x,
    y,
    w: size.w,
    h: size.h,
    props: mergeProps(def.defaultProps, preset.defaultProps)
  };
}

const BY_TYPE: Record<string, BlockDef> = Object.fromEntries(
  BLOCK_DEFS.map((d) => [d.type, d])
);

export function getBlockDef(type: string): BlockDef | undefined {
  return BY_TYPE[type];
}

/** Crea un Block del catálogo, con id único. */
export function instantiateBlock(type: string, x: number, y: number): Block | null {
  const def = BY_TYPE[type];
  if (!def) return null;
  return {
    id: crypto.randomUUID(),
    type,
    x,
    y,
    w: def.defaultSize.w,
    h: def.defaultSize.h,
    props: structuredClone(def.defaultProps)
  };
}

/** Lee una prop con dot-notation. */
export function readProp(props: BlockProps, path: string): unknown {
  const parts = path.split('.');
  let cur: unknown = props;
  for (const p of parts) {
    if (cur && typeof cur === 'object' && p in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return cur;
}

/** Escribe una prop con dot-notation. */
export function writeProp(props: BlockProps, path: string, value: unknown): BlockProps {
  const parts = path.split('.');
  const next: BlockProps = structuredClone(props);
  let cur: Record<string, unknown> = next as Record<string, unknown>;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (cur[k] == null || typeof cur[k] !== 'object') cur[k] = {};
    cur = cur[k] as Record<string, unknown>;
  }
  cur[parts[parts.length - 1]] = value;
  return next;
}

// Helpers legacy todavía referenciados.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function isAutoId(id: string): boolean {
  return UUID_RE.test(id);
}
export function isCatalogType(_t: string): boolean {
  return false;
}
export function catalogIdOfType(_t: string): string | null {
  return null;
}
