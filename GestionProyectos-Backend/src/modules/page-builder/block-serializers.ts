// block-serializers.ts — convierte un Block del editor visual en JSX
// LITERAL (no string runtime) usando los MISMOS componentes shared que
// usa el resto de la app. Cada serializer devuelve los imports que
// necesita su salida y el JSX ya formateado.
//
// Las rutas de import están relativas a un archivo en
// `GestionProyectos-Frontend/src/modules/<key>/ui/pages/` → 4 niveles
// hasta `shared/`. Mantener sincronizado si la profundidad cambia.

/* eslint-disable @typescript-eslint/no-explicit-any */

interface Block {
  id: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  props: Record<string, any>;
}

export interface SerializeResult {
  /** Import statements completas, ej: `import Button from '...';`.
   *  Se deduplican por línea exacta antes de emitir el archivo. */
  imports: Set<string>;
  /** JSX del bloque SOLO (sin el wrapper de tamaño). El caller lo
   *  envuelve con su width/height. */
  jsx: string;
  /** Clase Tailwind que el cell wrapper debe aplicar para que el
   *  componente quede visualmente igual que en el editor (flex
   *  centrado, col-stretch para inputs, etc.). Por default solo es
   *  un block. Replica el wrapping interno de cada `render()` del
   *  manifest del editor. */
  wrapperClass?: string;
  /** Definición de un componente helper local que la página debe
   *  emitir arriba del default export. Cada helper tiene su propio
   *  `useState` AISLADO — un cambio en él no re-renderiza el resto
   *  de la página (Selects, Inputs, etc. quedan rápidos sin lag). */
  helperComponent?: string;
}

// Wrapper classes reutilizados por familia de componente.
const W_INLINE_CENTER = 'flex h-full w-full items-center';
const W_INLINE_CENTER_BOTH = 'flex h-full w-full items-center justify-center';
const W_FORM_TOP = 'flex h-full w-full flex-col justify-start';
const W_FORM_FILL = 'flex h-full w-full flex-col';

const SHARED = '../../../../shared/components';

// ─── Helpers ────────────────────────────────────────────────────────

/** JSX text content escaping. Para texto plano lo envolvemos en {} si
 *  contiene llaves o backticks; lo simple va directo. */
function jsxText(s: string): string {
  if (!s) return '';
  if (/[{}<>]/.test(s)) return `{${JSON.stringify(s)}}`;
  return s;
}

/** Atributo de prop JSX: string→"...", boolean→{true}, etc. */
function attr(name: string, value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'string') return ` ${name}=${JSON.stringify(value)}`;
  if (typeof value === 'boolean') return value ? ` ${name}` : ` ${name}={false}`;
  if (typeof value === 'number') return ` ${name}={${value}}`;
  return ` ${name}={${JSON.stringify(value)}}`;
}

function strProp(props: Record<string, any>, key: string, fallback = ''): string {
  const v = props[key];
  return typeof v === 'string' && v.length > 0 ? v : fallback;
}
function boolProp(props: Record<string, any>, key: string): boolean {
  return props[key] === true;
}
function listProp(props: Record<string, any>, key: string): string[] {
  const v = props[key];
  return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
}
function numListProp(props: Record<string, any>, key: string): number[] {
  const v = props[key];
  return Array.isArray(v) ? v.filter((x) => typeof x === 'number') : [];
}

// ─── Serializers por tipo ───────────────────────────────────────────

type Serializer = (b: Block) => SerializeResult;

const button: Serializer = (b) => {
  const label = strProp(b.props, 'label', 'Botón');
  const variant = strProp(b.props, 'variant', 'primary');
  return {
    imports: new Set([`import Button from '${SHARED}/Button/index.js';`]),
    jsx: `<Button type="button" variant=${JSON.stringify(variant)} size="sm" fullWidth>${jsxText(label)}</Button>`
  };
};

const icon: Serializer = (b) => {
  const svg = strProp(b.props, 'svg');
  if (!svg) {
    return {
      imports: new Set(),
      jsx: `<div className="flex h-full w-full items-center justify-center text-[10px] text-fg-faint">(icono)</div>`
    };
  }
  return {
    imports: new Set(),
    jsx: `<span className="flex h-full w-full items-center justify-center text-fg-muted [&_svg]:h-full [&_svg]:w-full" dangerouslySetInnerHTML={{ __html: ${JSON.stringify(svg)} }} />`
  };
};

const input: Serializer = (b) => {
  const hasLabel = boolProp(b.props, 'hasLabel');
  const label = strProp(b.props, 'label');
  const placeholder = strProp(b.props, 'placeholder');
  const labelAttr = hasLabel && label ? attr('label', label) : '';
  return {
    imports: new Set([`import Input from '${SHARED}/Input/index.js';`]),
    jsx: `<Input${labelAttr}${attr('placeholder', placeholder)} />`,
    wrapperClass: W_FORM_TOP
  };
};

const textarea: Serializer = (b) => {
  const hasLabel = boolProp(b.props, 'hasLabel');
  const label = strProp(b.props, 'label');
  const placeholder = strProp(b.props, 'placeholder');
  const labelAttr = hasLabel && label ? attr('label', label) : '';
  return {
    imports: new Set([`import Textarea from '${SHARED}/Textarea/index.js';`]),
    jsx: `<Textarea${labelAttr}${attr('placeholder', placeholder)} className="h-full resize-none" wrapperClassName="flex h-full flex-col" />`,
    wrapperClass: W_FORM_FILL
  };
};

// Counter incrementado por cada componente que necesita estado local
// (Select, Switch, Checkbox, Input, etc). Garantiza nombres únicos
// de helpers dentro de la misma página.
let _stateCounter = 0;
export function resetStateCounter(): void {
  _stateCounter = 0;
}

const select: Serializer = (b) => {
  const hasLabel = boolProp(b.props, 'hasLabel');
  const label = strProp(b.props, 'label');
  const options = listProp(b.props, 'options').map((o) => ({ value: o, label: o }));
  const labelAttr = hasLabel && label ? attr('label', label) : '';
  const name = `_S${_stateCounter++}`;
  return {
    imports: new Set([`import Select from '${SHARED}/Select/index.js';`]),
    jsx: `<${name} />`,
    wrapperClass: W_FORM_TOP,
    helperComponent:
      `function ${name}() {\n` +
      `  const [v, setV] = useState<string | null>(null);\n` +
      `  return <Select${labelAttr} options={${JSON.stringify(options)}} value={v} onChange={setV} />;\n` +
      `}`
  };
};

const searchInput: Serializer = (b) => {
  const placeholder = strProp(b.props, 'placeholder', 'Buscar...');
  return {
    imports: new Set([`import SearchInput from '${SHARED}/SearchInput/index.js';`]),
    jsx: `<SearchInput placeholder=${JSON.stringify(placeholder)} />`,
    wrapperClass: W_INLINE_CENTER
  };
};

const dateInput: Serializer = (b) => {
  const hasLabel = boolProp(b.props, 'hasLabel');
  const label = strProp(b.props, 'label');
  const labelAttr = hasLabel && label ? attr('label', label) : '';
  return {
    imports: new Set([`import DateInput from '${SHARED}/DateInput/index.js';`]),
    jsx: `<DateInput${labelAttr} />`,
    wrapperClass: W_FORM_TOP
  };
};

const colorPicker: Serializer = (b) => {
  const value = strProp(b.props, 'value', '#295072');
  return {
    imports: new Set([`import ColorPicker from '${SHARED}/ColorPicker/index.js';`]),
    jsx: `<ColorPicker value=${JSON.stringify(value)} />`,
    wrapperClass: W_INLINE_CENTER
  };
};

const switchBlock: Serializer = (b) => {
  const options = listProp(b.props, 'options');
  const opts = options.map((o) => ({ value: o, label: o }));
  const value = strProp(b.props, 'value', options[0] ?? '');
  const name = `_Sw${_stateCounter++}`;
  return {
    imports: new Set([`import Switch from '${SHARED}/Switch/index.js';`]),
    jsx: `<${name} />`,
    wrapperClass: W_INLINE_CENTER,
    helperComponent:
      `function ${name}() {\n` +
      `  const [v, setV] = useState<string>(${JSON.stringify(value)});\n` +
      `  return <Switch options={${JSON.stringify(opts)}} value={v} onChange={setV} />;\n` +
      `}`
  };
};

const checkbox: Serializer = (b) => {
  const label = strProp(b.props, 'label', 'Opción');
  const checked = boolProp(b.props, 'checked');
  const name = `_Cb${_stateCounter++}`;
  return {
    imports: new Set([`import Checkbox from '${SHARED}/Checkbox/index.js';`]),
    jsx: `<${name} />`,
    wrapperClass: W_INLINE_CENTER,
    helperComponent:
      `function ${name}() {\n` +
      `  const [v, setV] = useState<boolean>(${String(checked)});\n` +
      `  return <Checkbox checked={v} onChange={setV} label=${JSON.stringify(label)} />;\n` +
      `}`
  };
};

const badge: Serializer = (b) => {
  const text = strProp(b.props, 'text', 'Badge');
  const variant = strProp(b.props, 'variant', 'primary');
  return {
    imports: new Set([`import Badge from '${SHARED}/Badge/index.js';`]),
    jsx: `<Badge variant=${JSON.stringify(variant)} size="md" className="w-full justify-center">${jsxText(text)}</Badge>`,
    wrapperClass: W_INLINE_CENTER
  };
};

const levelChip: Serializer = (b) => {
  const level = strProp(b.props, 'level', 'info');
  return {
    imports: new Set([`import LevelChip from '${SHARED}/LevelChip/index.js';`]),
    jsx: `<LevelChip level=${JSON.stringify(level)} />`,
    wrapperClass: W_INLINE_CENTER
  };
};

const tagChip: Serializer = (b) => {
  const text = strProp(b.props, 'text', 'Tag');
  return {
    imports: new Set([`import TagChip from '${SHARED}/TagChip/index.js';`]),
    jsx: `<TagChip>${jsxText(text)}</TagChip>`,
    wrapperClass: W_INLINE_CENTER
  };
};

const filterChip: Serializer = (b) => {
  const text = strProp(b.props, 'text', 'Filtro');
  return {
    imports: new Set([`import FilterChip from '${SHARED}/FilterChip/index.js';`]),
    jsx: `<FilterChip active={false} onClick={() => {}}>${jsxText(text)}</FilterChip>`,
    wrapperClass: `${W_INLINE_CENTER} [&_>_*]:w-full [&_>_*]:justify-center`
  };
};

const avatar: Serializer = (b) => {
  const name = strProp(b.props, 'name', 'Usuario');
  return {
    imports: new Set([`import Avatar from '${SHARED}/Avatar/index.js';`]),
    jsx: `<Avatar name=${JSON.stringify(name)} />`,
    wrapperClass: `${W_INLINE_CENTER_BOTH} overflow-hidden`
  };
};

const tabs: Serializer = (b) => {
  const items = listProp(b.props, 'items').map((label, i) => ({
    id: `t${i}`,
    label
  }));
  const defaultValue = items[0]?.id ?? '';
  return {
    imports: new Set([`import Tabs from '${SHARED}/Tabs/index.js';`]),
    jsx: `<Tabs items={${JSON.stringify(items)}} defaultValue=${JSON.stringify(defaultValue)} />`
  };
};

const accordion: Serializer = (b) => {
  const items = listProp(b.props, 'items').map((title, i) => ({
    id: `a${i}`,
    title,
    content: ''
  }));
  return {
    imports: new Set([`import Accordion from '${SHARED}/Accordion/index.js';`]),
    jsx: `<Accordion items={${JSON.stringify(items)}} />`
  };
};

const stepper: Serializer = (b) => {
  const steps = listProp(b.props, 'steps').map((label) => ({ label }));
  return {
    imports: new Set([`import Stepper from '${SHARED}/Stepper/index.js';`]),
    jsx: `<Stepper steps={${JSON.stringify(steps)}} current={0} />`
  };
};

const table: Serializer = (b) => {
  const labels = listProp(b.props, 'columns');
  // SimpleTable necesita columns con `render: (row) => ReactNode`. Como
  // todavía no hay data, las celdas devuelven cadena vacía.
  const cols = labels
    .map(
      (label, i) =>
        `{ id: 'c${i}', label: ${JSON.stringify(label)}, render: () => '' }`
    )
    .join(', ');
  return {
    imports: new Set([`import SimpleTable from '${SHARED}/SimpleTable/index.js';`]),
    jsx: `<SimpleTable data={[]} columns={[${cols}]} />`
  };
};

const dataTable: Serializer = (b) => {
  const labels = listProp(b.props, 'columns');
  // DataTable necesita `accessor: (row) => unknown`. Stub: devuelve null.
  // `filter: 'select'` por columna habilita que aparezcan en el selector
  // "FILTRAR POR" de la toolbar — sino el dropdown queda vacío.
  const cols = labels
    .map(
      (label, i) =>
        `{ id: 'c${i}', label: ${JSON.stringify(label)}, accessor: () => null, filter: 'select' as const }`
    )
    .join(', ');
  return {
    imports: new Set([`import DataTable from '${SHARED}/DataTable/index.js';`]),
    jsx: `<DataTable data={[]} columns={[${cols}]} />`
  };
};

const container: Serializer = (b) => {
  // Mismo render que el manifest del editor: bg-bg + shadow-sm, sin
  // border. Radio según prop. Así canvas, preview y publicado coinciden.
  const r = typeof b.props.radius === 'string' ? b.props.radius : 'md';
  const cls =
    r === '2xl' ? 'rounded-2xl'
    : r === 'xl' ? 'rounded-xl'
    : r === 'lg' ? 'rounded-lg'
    : 'rounded-md';
  return {
    imports: new Set(),
    jsx: `<div className=${JSON.stringify(`h-full w-full bg-bg shadow-sm ${cls}`)} />`
  };
};

const progress: Serializer = (b) => {
  const value = typeof b.props.value === 'number' ? b.props.value : 60;
  return {
    imports: new Set([`import ProgressBar from '${SHARED}/ProgressBar/index.js';`]),
    jsx: `<ProgressBar value={${value}} />`,
    wrapperClass: W_INLINE_CENTER_BOTH
  };
};

const loader: Serializer = () => ({
  imports: new Set([`import Loader from '${SHARED}/Loader/index.js';`]),
  jsx: `<Loader />`,
  wrapperClass: W_INLINE_CENTER_BOTH
});

const skeleton: Serializer = (b) => {
  const variant = strProp(b.props, 'variant', 'rect');
  return {
    imports: new Set([`import Skeleton from '${SHARED}/Skeleton/index.js';`]),
    jsx: `<Skeleton variant=${JSON.stringify(variant)} width="100%" height="100%" />`
  };
};

const emptyState: Serializer = (b) => {
  const title = strProp(b.props, 'title', 'Sin datos');
  const description = strProp(b.props, 'description', '');
  return {
    imports: new Set([`import EmptyState from '${SHARED}/EmptyState/index.js';`]),
    jsx: `<EmptyState title=${JSON.stringify(title)}${attr('description', description)} />`
  };
};

const tooltip: Serializer = (b) => {
  const text = strProp(b.props, 'text', 'Tooltip');
  return {
    imports: new Set([`import Tooltip from '${SHARED}/Tooltip/index.js';`]),
    jsx: `<Tooltip content=${JSON.stringify(text)}><span className="inline-block h-full w-full" /></Tooltip>`
  };
};

const chartBar: Serializer = (b) => {
  const labels = listProp(b.props, 'labels');
  const values = numListProp(b.props, 'values');
  const data = labels.map((label, i) => ({ label, value: values[i] ?? 0 }));
  return {
    imports: new Set([`import { BarChart } from '${SHARED}/Charts/index.js';`]),
    jsx: `<BarChart data={${JSON.stringify(data)}} className="!h-full" />`
  };
};

const chartLine: Serializer = (b) => {
  const labels = listProp(b.props, 'labels');
  const series = [{ label: 'Serie', points: labels.map((_, i) => 5 + ((i * 7) % 20)) }];
  return {
    imports: new Set([`import { LineChart } from '${SHARED}/Charts/index.js';`]),
    jsx: `<LineChart series={${JSON.stringify(series)}} labels={${JSON.stringify(labels)}} area className="!h-full" />`
  };
};

const chartDonut: Serializer = (b) => {
  const labels = listProp(b.props, 'labels');
  const values = numListProp(b.props, 'values');
  const data = labels.map((label, i) => ({ label, value: values[i] ?? 1 }));
  return {
    imports: new Set([`import { DonutChart } from '${SHARED}/Charts/index.js';`]),
    jsx: `<DonutChart data={${JSON.stringify(data)}} />`
  };
};

const chartSparkline: Serializer = (b) => {
  const points = numListProp(b.props, 'points');
  return {
    imports: new Set([`import { Sparkline } from '${SHARED}/Charts/index.js';`]),
    jsx: `<Sparkline points={${JSON.stringify(points)}} height={40} />`
  };
};

// ─── Registry ───────────────────────────────────────────────────────

const REGISTRY: Record<string, Serializer> = {
  button,
  icon,
  input,
  textarea,
  select,
  'search-input': searchInput,
  'date-input': dateInput,
  'color-picker': colorPicker,
  switch: switchBlock,
  checkbox,
  badge,
  'level-chip': levelChip,
  'tag-chip': tagChip,
  'filter-chip': filterChip,
  avatar,
  tabs,
  accordion,
  stepper,
  table,
  'data-table': dataTable,
  container,
  progress,
  loader,
  skeleton,
  'empty-state': emptyState,
  tooltip,
  'chart-bar': chartBar,
  'chart-line': chartLine,
  'chart-donut': chartDonut,
  'chart-sparkline': chartSparkline
};

/** Bloque desconocido → placeholder visible. No bloquea la generación. */
function fallback(b: Block): SerializeResult {
  return {
    imports: new Set(),
    jsx: `<div className="flex h-full w-full items-center justify-center rounded border border-dashed border-border-subtle text-[10px] text-fg-faint">${jsxText(b.type)}</div>`
  };
}

export function serializeBlock(b: Block): SerializeResult {
  const fn = REGISTRY[b.type] ?? fallback;
  return fn(b);
}
