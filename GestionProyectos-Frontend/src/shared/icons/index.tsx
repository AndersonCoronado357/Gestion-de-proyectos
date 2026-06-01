// Iconos de la app — SIN SVG hardcodeado.
//
// Cada icono se renderiza LEYENDO el SVG desde la BASE DE DATOS (tabla
// `icons`) vía <Icon name>. Este archivo es sólo un mapa nombre→BD para que
// los 20+ archivos que ya importan estos componentes (`<HomeIcon/>`, etc.)
// sigan funcionando sin reescribirlos. La fuente de verdad de los SVG es la
// base de datos.

import Icon, { type IconProps } from './Icon.js';

export type { IconProps };
export { IconsProvider, useIconSvg } from './IconsContext.js';

const make =
  (name: string) =>
  (props: IconProps) =>
    <Icon name={name} {...props} />;

export const HeartPulseIcon = make('HeartPulseIcon');
export const ChevronRightIcon = make('ChevronRightIcon');
export const ChevronDownIcon = make('ChevronDownIcon');
export const SearchIcon = make('SearchIcon');
export const DashboardIcon = make('DashboardIcon');
export const HomeIcon = make('HomeIcon');
export const PatientsIcon = make('PatientsIcon');
export const AppointmentsIcon = make('AppointmentsIcon');
export const RecordsIcon = make('RecordsIcon');
export const PharmacyIcon = make('PharmacyIcon');
export const ReportsIcon = make('ReportsIcon');
export const SettingsIcon = make('SettingsIcon');
export const LabIcon = make('LabIcon');
export const StaffIcon = make('StaffIcon');
export const BillingIcon = make('BillingIcon');
export const MessagesIcon = make('MessagesIcon');
export const AuditIcon = make('AuditIcon');
export const ActivityIcon = make('ActivityIcon');
export const ListIcon = make('ListIcon');
export const PlusIcon = make('PlusIcon');
export const ClockIcon = make('ClockIcon');
export const CalendarIcon = make('CalendarIcon');
export const ArchiveIcon = make('ArchiveIcon');
export const BoxIcon = make('BoxIcon');
export const TruckIcon = make('TruckIcon');
export const BarChartIcon = make('BarChartIcon');
export const UserCircleIcon = make('UserCircleIcon');
export const ShieldIcon = make('ShieldIcon');
export const StethoscopeIcon = make('StethoscopeIcon');
export const ClipboardIcon = make('ClipboardIcon');
export const FileTextIcon = make('FileTextIcon');
export const WalletIcon = make('WalletIcon');
export const BellIcon = make('BellIcon');
export const KeyIcon = make('KeyIcon');
export const HistoryIcon = make('HistoryIcon');
export const TriageIcon = make('TriageIcon');
export const BedIcon = make('BedIcon');
export const AmbulanceIcon = make('AmbulanceIcon');
export const ScalpelIcon = make('ScalpelIcon');
export const LogoutIcon = make('LogoutIcon');
export const GoogleIcon = make('GoogleIcon');
export const EyeIcon = make('EyeIcon');
export const EyeOffIcon = make('EyeOffIcon');
export const MailIcon = make('MailIcon');
export const LockIcon = make('LockIcon');
export const FolderPlusIcon = make('FolderPlusIcon');
export const SunIcon = make('SunIcon');
export const MoonIcon = make('MoonIcon');
export const CheckIcon = make('CheckIcon');
export const SparkleIcon = make('SparkleIcon');
export const FileIcon = make('FileIcon');
export const DatabaseIcon = make('DatabaseIcon');
export const LayoutIcon = make('LayoutIcon');
export const ZapIcon = make('ZapIcon');
export const ApiIcon = make('ApiIcon');
export const MaximizeIcon = make('MaximizeIcon');
export const MinimizeIcon = make('MinimizeIcon');
export const PlayIcon = make('PlayIcon');
export const PanelLeftIcon = make('PanelLeftIcon');
export const XIcon = make('XIcon');
export const TrashIcon = make('TrashIcon');
export const UploadIcon = make('UploadIcon');
export const GripIcon = make('GripIcon');
export const FolderIcon = make('FolderIcon');
