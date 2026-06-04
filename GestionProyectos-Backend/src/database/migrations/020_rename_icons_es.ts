// Agrega `display_name` a la tabla `icons` con el nombre traducido al
// español. `name` se mantiene como clave técnica (HomeIcon, BoxIcon, etc.)
// porque el frontend lo usa para resolver `<NombreIcon />` por nombre.

import type { Knex } from 'knex';

const DISPLAY_NAMES: Record<string, string> = {
  ActivityIcon: 'Actividad',
  AmbulanceIcon: 'Ambulancia',
  ApiIcon: 'API',
  AppointmentsIcon: 'Citas',
  ArchiveIcon: 'Archivo',
  AuditIcon: 'Auditoría',
  BarChartIcon: 'Gráfico de barras',
  BedIcon: 'Cama',
  BellIcon: 'Campana',
  BillingIcon: 'Facturación',
  BoxIcon: 'Caja',
  CheckCircleIcon: 'Check redondo',
  CheckIcon: 'Check',
  ChevronDownIcon: 'Flecha abajo',
  ChevronLeftIcon: 'Flecha izquierda',
  ChevronRightIcon: 'Flecha derecha',
  ClipboardIcon: 'Portapapeles',
  ClockIcon: 'Reloj',
  DashboardIcon: 'Tablero',
  DatabaseIcon: 'Base de datos',
  EyeIcon: 'Ojo',
  EyeOffIcon: 'Ojo cerrado',
  FileIcon: 'Archivo (hoja)',
  FileTextIcon: 'Documento',
  FolderIcon: 'Carpeta',
  FolderPlusIcon: 'Carpeta nueva',
  GoogleIcon: 'Google (login)',
  GripIcon: 'Mover',
  HeartPulseIcon: 'Pulso cardíaco',
  HistoryIcon: 'Historial',
  HomeIcon: 'Inicio',
  KeyIcon: 'Llave',
  LabIcon: 'Laboratorio',
  LayoutIcon: 'Diseño',
  ListIcon: 'Lista',
  LockIcon: 'Candado',
  LogoutIcon: 'Cerrar sesión',
  MailIcon: 'Correo',
  MaximizeIcon: 'Maximizar',
  MessagesIcon: 'Mensajes',
  MinimizeIcon: 'Minimizar',
  MoonIcon: 'Luna',
  PanelLeftIcon: 'Panel lateral',
  PatientsIcon: 'Pacientes',
  PharmacyIcon: 'Farmacia',
  PlayIcon: 'Reproducir',
  PlusIcon: 'Más',
  RecordsIcon: 'Registros',
  ReportsIcon: 'Reportes',
  ScalpelIcon: 'Bisturí',
  SearchIcon: 'Buscar',
  SettingsIcon: 'Configuración',
  ShieldIcon: 'Escudo',
  SparkleIcon: 'Destellos',
  StaffIcon: 'Personal',
  StethoscopeIcon: 'Estetoscopio',
  SunIcon: 'Sol',
  TrashIcon: 'Papelera',
  TriageIcon: 'Clasificación',
  TruckIcon: 'Camión',
  UploadIcon: 'Subir',
  UserCircleIcon: 'Usuario',
  WalletIcon: 'Cartera',
  XIcon: 'Cerrar',
  ZapIcon: 'Rayo',
  IconGalleryIcon: 'Galería de iconos'
};

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('icons'))) return;

  if (!(await knex.schema.hasColumn('icons', 'display_name'))) {
    await knex.schema.alterTable('icons', (t) => {
      t.string('display_name', 200).nullable();
    });
  }

  for (const [techKey, esName] of Object.entries(DISPLAY_NAMES)) {
    await knex('icons').where('name', techKey).update({ display_name: esName });
  }
}

export async function down(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable('icons'))) return;
  if (!(await knex.schema.hasColumn('icons', 'display_name'))) return;
  await knex.schema.alterTable('icons', (t) => {
    t.dropColumn('display_name');
  });
}
