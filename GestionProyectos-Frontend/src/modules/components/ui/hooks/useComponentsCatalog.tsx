import { useEffect, useState } from 'react';
import Button from '../../../../shared/components/Button/index.js';
import Input from '../../../../shared/components/Input/index.js';
import SearchInput from '../../../../shared/components/SearchInput/index.js';
import ColorPicker from '../../../../shared/components/ColorPicker/index.js';
import DataTable, { type ColumnDef } from '../../../../shared/components/DataTable/index.js';
import {
  DonutChart,
  BarChart,
  MultiBarChart,
  LineChart,
  GanttChart,
  Sparkline,
  RadarChart,
  PolarAreaChart,
  ScatterChart,
  BubbleChart,
  ComboChart,
  GaugeChart,
  type ChartDatum,
  type LineSeries,
  type GanttTask,
  type BarSeries,
  type ScatterSeries,
  type BubbleSeries
} from '../../../../shared/components/Charts/index.js';
import Textarea from '../../../../shared/components/Textarea/index.js';
import Select from '../../../../shared/components/Select/index.js';
import Skeleton from '../../../../shared/components/Skeleton/index.js';
import ProgressBar from '../../../../shared/components/ProgressBar/index.js';
import Loader from '../../../../shared/components/Loader/index.js';
import Alert from '../../../../shared/components/Alert/index.js';
import Tooltip from '../../../../shared/components/Tooltip/index.js';
import DragDropList, { DragDropZone, DragDropZoneContainer } from '../../../../shared/components/DragDropList/index.js';
import DateInput from '../../../../shared/components/DateInput/index.js';
import Checkbox from '../../../../shared/components/Checkbox/index.js';
import Switch from '../../../../shared/components/Switch/index.js';
import { useToast } from '../../../../shared/components/Toast/index.js';
import { useTheme } from '../../../../shared/theme/ThemeContext.jsx';
import {
  PlusIcon,
  TrashIcon,
  CheckIcon,
  MailIcon,
  LockIcon
} from '../../../../shared/icons/index.jsx';
import { http } from '../../../../shared/utils/http.js';
import SimpleTable, { type SimpleColumn } from '../../../../shared/components/SimpleTable/index.js';

function InputsPreview() {
  const [text, setText] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [num, setNum] = useState('');
  const [tel, setTel] = useState('');
  const [date, setDate] = useState('');
  // autoComplete: deshabilitado en el catálogo para que el navegador no
  // prellene los inputs con credenciales/datos guardados de otras vistas.
  // 'new-password' en el de contraseña es el truco estándar para que
  // Chrome/Firefox no inyecten la password guardada del login.
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Input label="Texto" placeholder="Texto de ejemplo" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" />
      <Input label="Email" type="email" placeholder="correo@dominio.com" leftIcon={<MailIcon width={14} height={14} />} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" />
      <Input label="Contraseña" type="password" placeholder="••••••••" leftIcon={<LockIcon width={14} height={14} />} value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="new-password" />
      <Input label="Número" type="number" placeholder="0" value={num} onChange={(e) => setNum(e.target.value)} autoComplete="off" />
      <Input label="Teléfono" type="tel" placeholder="+57 300 000 0000" value={tel} onChange={(e) => setTel(e.target.value)} autoComplete="off" />
      <Input label="URL" type="url" placeholder="https://ejemplo.com" autoComplete="off" />
      <Input label="Con error" placeholder="correo@dominio.com" defaultValue="correo-invalido" error="Formato inválido" leftIcon={<MailIcon width={14} height={14} />} autoComplete="off" />
      <Input label="Con hint" placeholder="Cualquier valor" hint="Texto de ayuda secundario" autoComplete="off" />
    </div>
  );
}

function TextareaPreview() {
  const [v, setV] = useState('');
  return (
    <div className="w-full max-w-[420px]">
      <Textarea
        label="Comentarios"
        placeholder="Escribe tus observaciones aquí..."
        rows={3}
        hint="Máximo 500 caracteres."
        value={v}
        onChange={(e) => setV(e.target.value)}
      />
    </div>
  );
}

function SearchPreview() {
  const [v, setV] = useState('');
  return (
    <div className="w-full max-w-[280px]">
      <SearchInput value={v} onChange={(e) => setV(e.target.value)} placeholder="Buscar..." />
    </div>
  );
}

function SelectPreview() {
  const [a, setA] = useState<string | null>('opt1');
  const [b, setB] = useState<string | null>(null);
  return (
    <div className="flex w-full max-w-[520px] flex-wrap gap-6">
      <div className="w-[220px]">
        <Select
          label="Sin buscador"
          options={['Opción 1', 'Opción 2', 'Opción 3', 'Opción 4'].map((v) => ({
            value: v.toLowerCase().replace(' ', ''),
            label: v
          }))}
          value={a}
          onChange={setA}
          placeholder="Seleccionar"
        />
      </div>
      <div className="w-[220px]">
        <Select
          label="Con buscador"
          searchable
          options={[
            'Opción 1',
            'Opción 2',
            'Opción 3',
            'Opción 4',
            'Opción 5',
            'Opción 6',
            'Opción 7',
            'Opción 8'
          ].map((v) => ({ value: v.toLowerCase().replace(' ', ''), label: v }))}
          value={b}
          onChange={setB}
          placeholder="Buscar opción"
        />
      </div>
    </div>
  );
}

function ColorPickerPreview() {
  const { accentHex } = useTheme();
  const [color, setColor] = useState(accentHex);
  return (
    <div className="w-full max-w-[220px]">
      <ColorPicker value={color} onChange={setColor} showScale={false} />
    </div>
  );
}

interface DemoRow {
  id: string;
  [key: string]: string;
}

function makeDemoTable(cols = 4, rows = 8) {
  const columns: ColumnDef<DemoRow>[] = Array.from({ length: cols }).map(
    (_, i) => ({
      id: `col-${i}`,
      label: `Columna ${i + 1}`,
      accessor: (r: DemoRow) => r[`col-${i}`],
      filter: i < 2 ? ('select' as const) : undefined
    })
  );
  const data: DemoRow[] = Array.from({ length: rows }).map((_, r) => {
    const row: DemoRow = { id: `r-${r}` };
    columns.forEach((_c, i) => {
      row[`col-${i}`] = `Dato ${r + 1}.${i + 1}`;
    });
    return row;
  });
  return { columns, data };
}

function DataTablePreview() {
  const { columns, data } = makeDemoTable(4, 8);
  return (
    <div className="h-[360px] w-full overflow-hidden rounded-lg ring-1 ring-border-subtle">
      <DataTable data={data} columns={columns} initialPageSize={5} />
    </div>
  );
}

// SimpleTable — tabla limpia (cabecera barra + filas alternadas), datos demo
// genéricos (nada que parezca real).
function SimpleTablePreview() {
  const cols: SimpleColumn<DemoRow>[] = [
    { id: 'c1', label: 'Columna A', render: (r) => r.c1, width: 200 },
    { id: 'c2', label: 'Columna B', render: (r) => r.c2 },
    { id: 'c3', label: 'Columna C', render: (r) => r.c3 },
    { id: 'c4', label: 'Columna D', render: (r) => r.c4 },
    { id: 'c5', label: 'Columna E', render: (r) => r.c5 },
    { id: 'c6', label: 'Columna F', render: (r) => r.c6 }
  ];
  const data: DemoRow[] = Array.from({ length: 16 }, (_, i) => {
    const n = i + 1;
    return {
      id: String(n),
      c1: `Dato ${n}.1`,
      c2: `Dato ${n}.2`,
      c3: `Dato ${n}.3`,
      c4: `Dato ${n}.4`,
      c5: `Dato ${n}.5`,
      c6: `Dato ${n}.6`
    };
  });
  return (
    <div className="h-[360px] w-full">
      <SimpleTable data={data} columns={cols} initialPageSize={10} />
    </div>
  );
}

function DonutChartPreview() {
  const data: ChartDatum[] = [
    { label: 'Categoría A', value: 45 },
    { label: 'Categoría B', value: 30 },
    { label: 'Categoría C', value: 15 },
    { label: 'Categoría D', value: 10 }
  ];
  const [sel, setSel] = useState<number | null>(null);
  return (
    <div className="w-full max-w-[620px]">
      <DonutChart
        data={data}
        centerValue="100"
        centerLabel="Total"
        onSelect={(i) => setSel((s) => (s === i ? null : i))}
        selectedIndex={sel}
      />
    </div>
  );
}

function BarChartPreview() {
  const data: ChartDatum[] = [
    { label: 'Categoría A', value: 32 },
    { label: 'Categoría B', value: 24 },
    { label: 'Categoría C', value: 41 },
    { label: 'Categoría D', value: 18 },
    { label: 'Categoría E', value: 29 }
  ];
  return (
    <div className="flex w-full max-w-[780px] flex-col gap-10">
      <BarChart data={data} />
      <BarChart data={data.slice(0, 4)} orientation="horizontal" />
    </div>
  );
}

function LineChartPreview() {
  const series: LineSeries[] = [
    { label: 'Serie 1', points: [12, 18, 15, 24, 22, 30] },
    { label: 'Serie 2', points: [8, 10, 14, 13, 19, 21] }
  ];
  const labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'];
  return (
    <div className="w-full max-w-[780px]">
      <LineChart series={series} labels={labels} area showLegend />
    </div>
  );
}

function GanttChartPreview() {
  const tasks: GanttTask[] = [
    { label: 'Tarea 1', start: 0, end: 3 },
    { label: 'Tarea 2', start: 2, end: 6 },
    { label: 'Tarea 3', start: 4, end: 7 },
    { label: 'Tarea 4', start: 6, end: 10 },
    { label: 'Tarea 5', start: 8, end: 10 }
  ];
  return (
    <div className="w-full max-w-[780px]">
      <GanttChart tasks={tasks} total={10} />
    </div>
  );
}

function LineNoPointsPreview() {
  const series: LineSeries[] = [
    { label: 'Serie 1', points: [12, 18, 15, 24, 22, 30] },
    { label: 'Serie 2', points: [8, 10, 14, 13, 19, 21] }
  ];
  const labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5', 'Sem 6'];
  return (
    <div className="w-full max-w-[780px]">
      <LineChart series={series} labels={labels} area showLegend showPoints={false} />
    </div>
  );
}

function SparklinePreview() {
  const rows = [
    { label: 'Serie A', value: '1.2k', points: [4, 6, 5, 8, 7, 10, 9, 12] },
    { label: 'Serie B', value: '348', points: [10, 8, 9, 6, 7, 5, 6, 4] },
    { label: 'Serie C', value: '92%', points: [3, 5, 4, 6, 8, 7, 9, 11] }
  ];
  return (
    <div className="flex w-full max-w-[440px] flex-col gap-2">
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-3 rounded-xl bg-bg-muted p-3">
          <div className="w-20 shrink-0">
            <div className="text-[11px] text-fg-faint">{r.label}</div>
            <div className="text-[16px] font-bold text-fg">{r.value}</div>
          </div>
          <div className="min-w-0 flex-1">
            <Sparkline points={r.points} height={40} />
          </div>
        </div>
      ))}
    </div>
  );
}

function RadarChartPreview() {
  const labels = ['Velocidad', 'Calidad', 'Costo', 'Alcance', 'Riesgo', 'Soporte'];
  const series: LineSeries[] = [
    { label: 'Serie 1', points: [8, 6, 7, 9, 5, 8] },
    { label: 'Serie 2', points: [5, 9, 6, 4, 8, 6] }
  ];
  return (
    <div className="w-full max-w-[460px]">
      <RadarChart labels={labels} series={series} />
    </div>
  );
}

function MultiBarPreview() {
  const labels = ['Cat A', 'Cat B', 'Cat C', 'Cat D'];
  const series: BarSeries[] = [
    { label: 'Serie 1', data: [12, 19, 8, 15] },
    { label: 'Serie 2', data: [8, 11, 14, 9] },
    { label: 'Serie 3', data: [5, 7, 6, 12] }
  ];
  return (
    <div className="flex w-full max-w-[780px] flex-col gap-10">
      <MultiBarChart labels={labels} series={series} />
      <MultiBarChart labels={labels} series={series} stacked />
    </div>
  );
}

function PolarAreaPreview() {
  const data: ChartDatum[] = [
    { label: 'Categoría A', value: 11 },
    { label: 'Categoría B', value: 16 },
    { label: 'Categoría C', value: 7 },
    { label: 'Categoría D', value: 14 },
    { label: 'Categoría E', value: 9 }
  ];
  const [sel, setSel] = useState<number | null>(null);
  return (
    <div className="w-full max-w-[620px]">
      <PolarAreaChart
        data={data}
        onSelect={(i) => setSel((s) => (s === i ? null : i))}
        selectedIndex={sel}
      />
    </div>
  );
}

function ComboPreview() {
  const labels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  const bars: BarSeries[] = [{ label: 'Cantidad', data: [12, 19, 14, 22, 18, 26] }];
  const line = { label: 'Tendencia', data: [10, 15, 16, 19, 21, 25] };
  return (
    <div className="w-full max-w-[780px]">
      <ComboChart labels={labels} bars={bars} line={line} />
    </div>
  );
}

function ScatterPreview() {
  const series: ScatterSeries[] = [
    {
      label: 'Serie 1',
      points: [
        { x: 5, y: 8 },
        { x: 12, y: 14 },
        { x: 18, y: 10 },
        { x: 24, y: 22 },
        { x: 30, y: 18 },
        { x: 36, y: 28 }
      ]
    },
    {
      label: 'Serie 2',
      points: [
        { x: 8, y: 4 },
        { x: 14, y: 9 },
        { x: 22, y: 7 },
        { x: 28, y: 15 },
        { x: 34, y: 12 }
      ]
    }
  ];
  return (
    <div className="w-full max-w-[680px]">
      <ScatterChart series={series} />
    </div>
  );
}

function BubblePreview() {
  const series: BubbleSeries[] = [
    {
      label: 'Serie 1',
      points: [
        { x: 10, y: 12, r: 8 },
        { x: 20, y: 18, r: 16 },
        { x: 30, y: 10, r: 10 },
        { x: 40, y: 24, r: 22 }
      ]
    },
    {
      label: 'Serie 2',
      points: [
        { x: 15, y: 6, r: 12 },
        { x: 25, y: 20, r: 9 },
        { x: 35, y: 14, r: 18 }
      ]
    }
  ];
  return (
    <div className="w-full max-w-[680px]">
      <BubbleChart series={series} />
    </div>
  );
}

function GaugePreview() {
  return (
    <div className="grid w-full max-w-[620px] grid-cols-1 gap-4 sm:grid-cols-2">
      <GaugeChart value={72} label="Avance" />
      <GaugeChart value={45} label="Capacidad" />
    </div>
  );
}

function ProgressPreview() {
  // Animación de fill que recorre 0→100% en loop, para mostrar el
  // comportamiento "se va llenando" del componente.
  const [value, setValue] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setValue((v) => (v >= 100 ? 0 : v + 4));
    }, 200);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex w-full max-w-[420px] flex-col gap-4">
      <ProgressBar value={value} label="Cargando archivo" showLabel />
      <ProgressBar value={value} variant="success" size="sm" />
    </div>
  );
}

function SkeletonPreview() {
  return (
    <div className="flex w-full max-w-[420px] items-start gap-4">
      <Skeleton variant="circle" width={48} height={48} />
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton variant="text" width="60%" height={12} />
        <Skeleton variant="text" width="90%" height={10} />
        <Skeleton variant="text" width="75%" height={10} />
      </div>
    </div>
  );
}

function LoaderPreview() {
  const [showOverlay, setShowOverlay] = useState(false);
  return (
    <div className="flex items-center gap-6">
      <Loader />
      <Button size="sm" variant="outline-primary" onClick={() => {
        setShowOverlay(true);
        setTimeout(() => setShowOverlay(false), 2200);
      }}>
        Mostrar overlay fullscreen
      </Button>
      {showOverlay && <Loader overlay />}
    </div>
  );
}

function AlertPreview() {
  const [type, setType] = useState<'success' | 'error' | 'warning' | 'confirm' | null>(null);
  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="success" onClick={() => setType('success')}>Éxito</Button>
      <Button size="sm" variant="danger" onClick={() => setType('error')}>Error</Button>
      <Button size="sm" variant="warning" onClick={() => setType('warning')}>Advertencia</Button>
      <Button size="sm" onClick={() => setType('confirm')}>Confirmar</Button>
      {type && (
        <Alert
          type={type}
          message={
            type === 'confirm'
              ? '¿Estás seguro de continuar con esta acción?'
              : 'Esto es un mensaje de ejemplo para la alerta.'
          }
          onConfirm={() => setType(null)}
          onCancel={type === 'confirm' ? () => setType(null) : undefined}
          onClose={() => setType(null)}
        />
      )}
    </div>
  );
}

function ToastPreview() {
  const toast = useToast();
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="success" onClick={() => toast.success({ title: 'Success', message: 'Tus cambios se guardaron correctamente.' })}>
          Toast success
        </Button>
        <Button size="sm" variant="danger" onClick={() => toast.error({ title: 'Error', message: 'Ha ocurrido un error al guardar los cambios.' })}>
          Toast error
        </Button>
        <Button size="sm" variant="warning" onClick={() => toast.warning({ title: 'Warning', message: 'El usuario ingresado no es válido.' })}>
          Toast warning
        </Button>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
          Posición
        </span>
        {(['top-right', 'bottom-right'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => toast.setPosition(p)}
            className={cnLocal(
              'inline-flex h-7 items-center rounded-full px-2.5 text-[10.5px] font-medium outline-none transition-colors',
              toast.position === p
                ? 'bg-primary text-on-primary'
                : 'bg-bg-muted text-fg-subtle hover:bg-primary-50 hover:text-primary-700'
            )}
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}

function cnLocal(...args) {
  return args.filter(Boolean).join(' ');
}

function TooltipPreview() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Tooltip content="Arriba (top)" side="top">
        <Button size="sm">Top</Button>
      </Tooltip>
      <Tooltip content="Abajo (bottom)" side="bottom">
        <Button size="sm" variant="secondary">Bottom</Button>
      </Tooltip>
      <Tooltip content="Izquierda (left)" side="left">
        <Button size="sm" variant="secondary">Left</Button>
      </Tooltip>
      <Tooltip content="Derecha (right)" side="right">
        <Button size="sm" variant="secondary">Right</Button>
      </Tooltip>
      <Tooltip
        content={
          <span>
            Acepta <strong>JSX</strong>.<br />
            Aparece con animación de escala.
          </span>
        }
      >
        <span className="cursor-help text-[12.5px] font-medium text-primary-700 underline decoration-dotted">
          ¿Qué es esto?
        </span>
      </Tooltip>
    </div>
  );
}

function DateInputPreview() {
  const [date, setDate] = useState<Date | null>(null);
  const [date2, setDate2] = useState<Date | null>(new Date());
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="w-full max-w-[280px]">
        <DateInput
          label="Fecha"
          value={date}
          onChange={setDate}
          placeholder="DD/MM/AAAA"
          hint="Click para abrir el calendario"
        />
      </div>
      <div className="w-full max-w-[280px]">
        <DateInput
          label="Fecha de nacimiento"
          value={date2}
          onChange={setDate2}
        />
      </div>
    </div>
  );
}

function CheckboxPreview() {
  const [remember, setRemember] = useState(true);
  const [news, setNews] = useState(false);
  const [extUbi, setExtUbi] = useState(true);
  const [extUlt, setExtUlt] = useState(false);
  const [extDiag, setExtDiag] = useState(false);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
          Inline
        </p>
        <div className="flex flex-wrap items-center gap-6">
          <Checkbox checked={remember} onChange={setRemember} label="Recordar sesión" />
          <Checkbox checked={news} onChange={setNews} label="Suscribirme a novedades" />
          <Checkbox checked={false} onChange={() => {}} label="Deshabilitado" disabled />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
          Card (con descripción)
        </p>
        <div className="flex w-full max-w-[420px] flex-col gap-2">
          <Checkbox
            variant="card"
            label="Opción con descripción A"
            description="Texto descriptivo de ejemplo para la primera opción."
            checked={extUbi}
            onChange={setExtUbi}
          />
          <Checkbox
            variant="card"
            label="Opción con descripción B"
            description="Texto descriptivo de ejemplo para la segunda opción."
            checked={extUlt}
            onChange={setExtUlt}
          />
          <Checkbox
            variant="card"
            label="Opción con descripción C"
            description="Texto descriptivo de ejemplo para la tercera opción."
            checked={extDiag}
            onChange={setExtDiag}
          />
        </div>
      </div>
    </div>
  );
}

function SwitchPreview() {
  type Centro = 'o1' | 'o2';
  type Ambiente = 'DEV' | 'QAS' | 'PRD';
  type Modo = 't1' | 't2' | 't3' | 't4';
  const [centro, setCentro] = useState<Centro>('o1');
  const [ambiente, setAmbiente] = useState<Ambiente>('DEV');
  const [modo, setModo] = useState<Modo>('t1');
  return (
    <div className="flex w-full max-w-[440px] flex-col gap-5">
      <Switch<Centro>
        label="Opciones"
        options={[
          { value: 'o1', label: 'Opción 1' },
          { value: 'o2', label: 'Opción 2' }
        ]}
        value={centro}
        onChange={setCentro}
        hint={
          centro === 'o1'
            ? 'Opción 1 seleccionada'
            : 'Opción 2 seleccionada'
        }
      />
      <Switch<Ambiente>
        label="Ambiente"
        options={[
          { value: 'DEV', label: 'Desarrollo' },
          { value: 'QAS', label: 'Calidad' },
          { value: 'PRD', label: 'Producción' }
        ]}
        value={ambiente}
        onChange={setAmbiente}
      />
      <Switch<Modo>
        label="Selección (4 opciones)"
        options={[
          { value: 't1', label: 'Tipo 1' },
          { value: 't2', label: 'Tipo 2' },
          { value: 't3', label: 'Tipo 3' },
          { value: 't4', label: 'Tipo 4' }
        ]}
        value={modo}
        onChange={setModo}
      />
      <Switch
        label="Deshabilitado"
        options={[
          { value: 'a', label: 'Opción A' },
          { value: 'b', label: 'Opción B' }
        ]}
        value="a"
        onChange={() => {}}
        disabled
      />
    </div>
  );
}

function DragDropReorderPreview() {
  const [items, setItems] = useState([
    { id: '1', label: 'Elemento 1' },
    { id: '2', label: 'Elemento 2' },
    { id: '3', label: 'Elemento 3' },
    { id: '4', label: 'Elemento 4' },
    { id: '5', label: 'Elemento 5' }
  ]);
  return (
    <div className="w-full max-w-[360px]">
      <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider text-fg-faint">
        Reordenar dentro de la lista
      </p>
      <DragDropList
        items={items}
        onReorder={setItems}
        renderItem={(it) => <span className="text-[12.5px] text-fg">{it.label}</span>}
      />
    </div>
  );
}

function DragDropZonesPreview() {
  const [pendientes, setPendientes] = useState([
    { id: 'p1', label: 'Tarea 1' },
    { id: 'p2', label: 'Tarea 2' },
    { id: 'p3', label: 'Tarea 3' }
  ]);
  const [enCurso, setEnCurso] = useState([
    { id: 'e1', label: 'Tarea 4' }
  ]);
  const [hechas, setHechas] = useState([
    { id: 'h1', label: 'Tarea 5' }
  ]);

  const zones = {
    pendientes: { state: pendientes, set: setPendientes },
    enCurso: { state: enCurso, set: setEnCurso },
    hechas: { state: hechas, set: setHechas }
  };

  const handleMove = ({ fromZone, toZone, key, overKey }) => {
    if (fromZone === toZone) {
      // Reorder dentro de la misma zona.
      const list = [...zones[fromZone].state];
      const fromIdx = list.findIndex((it) => it.id === key);
      if (fromIdx < 0) return;
      const [moved] = list.splice(fromIdx, 1);
      let toIdx;
      if (overKey) {
        toIdx = list.findIndex((it) => it.id === overKey);
        if (toIdx < 0) toIdx = list.length;
      } else {
        toIdx = list.length;
      }
      list.splice(toIdx, 0, moved);
      zones[fromZone].set(list);
      return;
    }
    // Cross-zone: insertar en la posición del item destino (o al final).
    const fromList = [...zones[fromZone].state];
    const idx = fromList.findIndex((it) => it.id === key);
    if (idx < 0) return;
    const [moved] = fromList.splice(idx, 1);
    const toList = [...zones[toZone].state];
    if (overKey) {
      const insertAt = toList.findIndex((it) => it.id === overKey);
      toList.splice(insertAt < 0 ? toList.length : insertAt, 0, moved);
    } else {
      toList.push(moved);
    }
    zones[fromZone].set(fromList);
    zones[toZone].set(toList);
  };

  return (
    <DragDropZoneContainer onMove={handleMove}>
      <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
        <DragDropZone zoneId="pendientes" title="Pendientes" items={pendientes} renderItem={(it) => <span className="text-[12px] text-fg">{it.label}</span>} />
        <DragDropZone zoneId="enCurso" title="En curso" items={enCurso} renderItem={(it) => <span className="text-[12px] text-fg">{it.label}</span>} />
        <DragDropZone zoneId="hechas" title="Hechas" items={hechas} renderItem={(it) => <span className="text-[12px] text-fg">{it.label}</span>} />
      </div>
    </DragDropZoneContainer>
  );
}

// La galería de iconos de la BD vive ahora en Administración → Iconos.
// El catálogo de Componentes sólo muestra primitivas de UI.

const CATALOG = [
  {
    id: 'button',
    name: 'Button',
    preview: () => (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm">Primary</Button>
          <Button variant="secondary" size="sm">Secondary</Button>
          <Button variant="ghost" size="sm">Ghost</Button>
          <Button variant="danger" size="sm">Danger</Button>
          <Button variant="success" size="sm">Success</Button>
          <Button variant="warning" size="sm">Warning</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline-primary" size="sm">Outline primary</Button>
          <Button variant="outline-danger" size="sm">Outline danger</Button>
          <Button variant="outline-success" size="sm">Outline success</Button>
          <Button variant="outline-warning" size="sm">Outline warning</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" leftIcon={<PlusIcon width={13} height={13} />}>Crear</Button>
          <Button variant="danger" size="sm" leftIcon={<TrashIcon width={13} height={13} />}>Eliminar</Button>
          <Button variant="outline-success" size="sm" leftIcon={<CheckIcon width={13} height={13} />}>Aprobar</Button>
        </div>
      </div>
    )
  },
  { id: 'inputs', name: 'Inputs', preview: () => <InputsPreview /> },
  { id: 'textarea', name: 'Textarea', preview: () => <TextareaPreview /> },
  { id: 'search-input', name: 'SearchInput', preview: () => <SearchPreview /> },
  { id: 'select', name: 'Select (select2)', preview: () => <SelectPreview /> },
  { id: 'color-picker', name: 'ColorPicker', preview: () => <ColorPickerPreview /> },
  { id: 'data-table', name: 'DataTable', preview: () => <DataTablePreview /> },
  {
    id: 'simple-table',
    name: 'SimpleTable (listado limpio)',
    preview: () => <SimpleTablePreview />
  },
  { id: 'chart-donut', name: 'DonutChart / Pastel', preview: () => <DonutChartPreview /> },
  { id: 'chart-bar', name: 'BarChart (barras)', preview: () => <BarChartPreview /> },
  { id: 'chart-line', name: 'LineChart (con puntos)', preview: () => <LineChartPreview /> },
  { id: 'chart-line-clean', name: 'LineChart (sin puntos)', preview: () => <LineNoPointsPreview /> },
  { id: 'chart-sparkline', name: 'Sparkline', preview: () => <SparklinePreview /> },
  { id: 'chart-radar', name: 'RadarChart (araña)', preview: () => <RadarChartPreview /> },
  { id: 'chart-multibar', name: 'MultiBarChart (agrupado / apilado)', preview: () => <MultiBarPreview /> },
  { id: 'chart-polar', name: 'PolarAreaChart', preview: () => <PolarAreaPreview /> },
  { id: 'chart-combo', name: 'ComboChart (barras + línea)', preview: () => <ComboPreview /> },
  { id: 'chart-scatter', name: 'ScatterChart (dispersión)', preview: () => <ScatterPreview /> },
  { id: 'chart-bubble', name: 'BubbleChart (burbujas)', preview: () => <BubblePreview /> },
  { id: 'chart-gauge', name: 'GaugeChart (medidor)', preview: () => <GaugePreview /> },
  { id: 'chart-gantt', name: 'GanttChart (cronograma)', preview: () => <GanttChartPreview /> },
  { id: 'progress-bar', name: 'LoadingBar', preview: () => <ProgressPreview /> },
  { id: 'skeleton', name: 'Skeleton', preview: () => <SkeletonPreview /> },
  { id: 'loader', name: 'Loader', preview: () => <LoaderPreview /> },
  { id: 'tooltip', name: 'Tooltip', preview: () => <TooltipPreview /> },
  { id: 'date-input', name: 'DateInput (input + calendario)', preview: () => <DateInputPreview /> },
  { id: 'checkbox', name: 'Checkbox (inline + card)', preview: () => <CheckboxPreview /> },
  { id: 'switch', name: 'Switch (segmented control)', preview: () => <SwitchPreview /> },
  { id: 'drag-drop', name: 'DragDrop · reordenar', preview: () => <DragDropReorderPreview /> },
  { id: 'drag-drop-zones', name: 'DragDrop · entre zonas (canvas)', preview: () => <DragDropZonesPreview /> },
  { id: 'alerts', name: 'Alert (modales)', preview: () => <AlertPreview /> },
  { id: 'toasts', name: 'Toast (notificaciones)', preview: () => <ToastPreview /> }
];

// ── Auto-discovery por convención ──────────────────────────────────────
// Cada componente en `shared/components/<X>/` puede exportar un archivo
// `<X>.preview.tsx` con:
//   - `export default function`: el componente de demo
//   - `export const meta = { id, name }`
// Vite recolecta TODOS esos archivos automáticamente (eager) → así no hay
// que tocar este hook al agregar componentes nuevos: con crear el preview
// alcanza para que aparezcan en el módulo de Componentes.

interface PreviewModule {
  default: () => React.ReactElement | null;
  meta: { id: string; name: string };
}

const PREVIEW_MODULES = import.meta.glob<PreviewModule>(
  '../../../../shared/components/*/*.preview.tsx',
  { eager: true }
);

interface CatalogEntry {
  id: string;
  name: string;
  preview: () => React.ReactElement | null;
}

const AUTO_ENTRIES: CatalogEntry[] = Object.values(PREVIEW_MODULES)
  .filter((m) => m && m.meta && typeof m.default === 'function')
  .map((m) => ({
    id: m.meta.id,
    name: m.meta.name,
    preview: m.default
  }));

export function useComponentsCatalog(): CatalogEntry[] {
  // Mantener orden: manual primero, luego auto-descubiertos que no estén
  // ya catalogados manualmente (dedupe por id).
  const seen = new Set(CATALOG.map((e) => e.id));
  const merged: CatalogEntry[] = [...CATALOG];
  for (const e of AUTO_ENTRIES) {
    if (!seen.has(e.id)) {
      merged.push(e);
      seen.add(e.id);
    }
  }
  return merged;
}
