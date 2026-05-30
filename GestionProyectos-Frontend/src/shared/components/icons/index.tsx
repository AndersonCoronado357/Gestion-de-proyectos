import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

const baseProps: SVGProps<SVGSVGElement> = {
  xmlns: 'http://www.w3.org/2000/svg',
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};

export const HeartPulseIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7Z" />
    <path d="M3.22 12H9.5l.5-1 2 4 2-7 1.5 4h5.27" />
  </svg>
);

export const ChevronRightIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="m9 18 6-6-6-6" />
  </svg>
);

export const ChevronDownIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const SearchIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </svg>
);

export const DashboardIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <rect x="3" y="3" width="7" height="9" rx="1.5" />
    <rect x="14" y="3" width="7" height="5" rx="1.5" />
    <rect x="14" y="12" width="7" height="9" rx="1.5" />
    <rect x="3" y="16" width="7" height="5" rx="1.5" />
  </svg>
);

export const HomeIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="m3 11 9-8 9 8" />
    <path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10" />
  </svg>
);

export const PatientsIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const AppointmentsIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

export const RecordsIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6" />
    <path d="M9 13h6M9 17h4" />
  </svg>
);

export const PharmacyIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M10.5 20.5 20.5 10.5a4.95 4.95 0 0 0-7-7L3.5 13.5a4.95 4.95 0 0 0 7 7Z" />
    <path d="m8.5 8.5 7 7" />
  </svg>
);

export const ReportsIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M3 3v18h18" />
    <path d="M7 14l4-4 3 3 5-6" />
  </svg>
);

export const SettingsIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
  </svg>
);

export const LabIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M9 2v6L4 18a2 2 0 0 0 1.73 3h12.54A2 2 0 0 0 20 18L15 8V2" />
    <path d="M7 2h10" />
    <path d="M6.5 13h11" />
  </svg>
);

export const StaffIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M11 2v2M11 22v-2M5 10a3 3 0 0 0-3 3v2a3 3 0 0 0 3 3" />
    <path d="M5 18a6 6 0 0 0 12 0v-3" />
    <circle cx="20" cy="10" r="2" />
    <circle cx="11" cy="6" r="2" />
  </svg>
);

export const BillingIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20M6 15h2M11 15h3" />
  </svg>
);

export const MessagesIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export const AuditIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M14 22H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h6l8 8v10a2 2 0 0 1-1 1.73" />
    <path d="M14 2v6h6" />
    <path d="M10 13h4M10 17h2" />
  </svg>
);

export const ActivityIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

export const ListIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M8 6h13M8 12h13M8 18h13" />
    <path d="M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
);

export const PlusIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const ClockIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const CalendarIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

export const ArchiveIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <rect x="2" y="4" width="20" height="5" rx="1" />
    <path d="M4 9v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" />
    <path d="M10 13h4" />
  </svg>
);

export const BoxIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
    <path d="m3.3 7 8.7 5 8.7-5M12 22V12" />
  </svg>
);

export const TruckIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M5 17h-2v-11a1 1 0 0 1 1-1h9v12m4 0h6v-5l-3-4h-7v9" />
    <circle cx="7.5" cy="17.5" r="2.5" />
    <circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);

export const BarChartIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M3 3v18h18" />
    <rect x="7" y="12" width="3" height="6" />
    <rect x="12" y="8" width="3" height="10" />
    <rect x="17" y="5" width="3" height="13" />
  </svg>
);

export const UserCircleIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="10" r="3" />
    <path d="M6.5 19a6.5 6.5 0 0 1 11 0" />
  </svg>
);

export const ShieldIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
  </svg>
);

export const StethoscopeIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.3.3 0 1 0 .2.3" />
    <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
    <circle cx="20" cy="10" r="2" />
  </svg>
);

export const ClipboardIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <rect x="8" y="2" width="8" height="4" rx="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M9 12h6M9 16h4" />
  </svg>
);

export const FileTextIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <path d="M14 2v6h6M9 13h6M9 17h6" />
  </svg>
);

export const WalletIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 1 0-4h13" />
    <path d="M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
    <circle cx="17" cy="13" r="1.5" />
  </svg>
);

export const BellIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

export const KeyIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <circle cx="7.5" cy="15.5" r="4.5" />
    <path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3" />
  </svg>
);

export const HistoryIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
    <path d="M3 3v5h5M12 7v5l4 2" />
  </svg>
);

export const TriageIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M3 4h18l-7 9v6l-4 2v-8z" />
  </svg>
);

export const BedIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M2 4v16M22 20V9H2" />
    <path d="M2 16h20" />
    <circle cx="7" cy="12" r="2" />
    <path d="M11 9V7a2 2 0 0 1 2-2h7v4" />
  </svg>
);

export const AmbulanceIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
    <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
    <circle cx="8" cy="18" r="2" />
    <circle cx="18" cy="18" r="2" />
    <path d="M8 9v4M6 11h4" />
  </svg>
);

export const ScalpelIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M21 4 14 11l-3-3z" />
    <path d="m11 8-8 13" />
    <path d="m14 11 4 4" />
  </svg>
);

export const LogoutIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5" />
    <path d="M21 12H9" />
  </svg>
);

export const GoogleIcon = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={18} height={18} viewBox="0 0 24 24" {...props}>
    <path fill="#4285F4" d="M23.06 12.25c0-.78-.07-1.54-.2-2.27H12v4.3h6.19c-.27 1.43-1.08 2.65-2.3 3.46v2.87h3.71c2.17-2 3.46-4.94 3.46-8.36z" />
    <path fill="#34A853" d="M12 23.5c3.13 0 5.74-1.04 7.65-2.81l-3.71-2.87c-1.03.69-2.34 1.1-3.94 1.1-3.03 0-5.6-2.04-6.51-4.79H1.66v3c1.92 3.79 5.84 6.37 10.34 6.37z" />
    <path fill="#FBBC04" d="M5.49 14.13c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18V6.77H1.66C.91 8.27.5 9.96.5 11.95s.41 3.68 1.16 5.18l3.83-2.99z" />
    <path fill="#EA4335" d="M12 5.13c1.71 0 3.24.59 4.45 1.74l3.29-3.29C17.74 1.7 15.13.5 12 .5 7.5.5 3.58 3.08 1.66 6.87l3.83 2.99c.91-2.75 3.48-4.79 6.51-4.79z" />
  </svg>
);

export const EyeIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export const EyeOffIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
    <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
    <line x1="2" x2="22" y1="2" y2="22" />
  </svg>
);

export const MailIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-10 5L2 7" />
  </svg>
);

export const LockIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <rect width="18" height="11" x="3" y="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const FolderPlusIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    <path d="M12 11v6M9 14h6" />
  </svg>
);

export const SunIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

export const MoonIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export const CheckIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const SparkleIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M5.6 18.4 18.4 5.6" />
  </svg>
);

export const FileIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

export const DatabaseIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M3 5v6c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    <path d="M3 11v6c0 1.66 4 3 9 3s9-1.34 9-3v-6" />
  </svg>
);

export const LayoutIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 9h18" />
    <path d="M9 21V9" />
  </svg>
);

export const ZapIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M13 2 3 14h9l-1 8 10-12h-9l1-8Z" />
  </svg>
);

export const ApiIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

export const MaximizeIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M8 3H5a2 2 0 0 0-2 2v3" />
    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
    <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
  </svg>
);

export const MinimizeIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M8 3v3a2 2 0 0 1-2 2H3" />
    <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
    <path d="M3 16h3a2 2 0 0 1 2 2v3" />
    <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
  </svg>
);

export const PlayIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

export const PanelLeftIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="M9 3v18" />
  </svg>
);

export const XIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const TrashIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export const UploadIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
  </svg>
);

export const GripIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <circle cx="9" cy="6" r="1" />
    <circle cx="9" cy="12" r="1" />
    <circle cx="9" cy="18" r="1" />
    <circle cx="15" cy="6" r="1" />
    <circle cx="15" cy="12" r="1" />
    <circle cx="15" cy="18" r="1" />
  </svg>
);

export const FolderIcon = (props: IconProps) => (
  <svg {...baseProps} {...props}>
    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
  </svg>
);
