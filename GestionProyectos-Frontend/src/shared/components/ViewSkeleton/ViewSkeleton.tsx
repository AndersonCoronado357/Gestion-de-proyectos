// ViewSkeleton — placeholder full-screen que imita la forma de la vista
// que está a punto de pintarse, en vez del clásico spinner.
//
// Detecta automáticamente qué "tipo" de pantalla viene mirando la ruta
// actual.  Las páginas reales de la app tienen layouts bien distintos
// (tabla con panel, builder de 2 cards, página de componentes con
// secciones verticales…) así que el skeleton se adapta para que la
// transición de "esqueleto → contenido" sea suave y no haga "salto".
//
// Para una ruta nueva, si no hay match en `routeToShape()` cae al
// `generic`, que es un card neutro tipo dashboard — suficiente para
// cualquier pantalla.

import { useLocation } from 'react-router-dom';
import Skeleton from '../Skeleton/index.js';
import { cn } from '../../lib/cn.js';

export type ViewSkeletonVariant = 'auto' | 'app' | 'login';

type Shape =
  | 'login'
  | 'home'
  | 'settings'
  | 'table'
  | 'builder'
  | 'master-detail'
  | 'components-list'
  | 'generic';

export interface ViewSkeletonProps {
  variant?: ViewSkeletonVariant;
  className?: string;
}

// Heurística por ruta. Cubre lo que YA existe + default genérico para
// rutas futuras.  El objetivo no es ser pixel-perfect, sino que la forma
// general (densidad, alineación, número de columnas) coincida con la
// página real para que no haya "salto" al cargar.
function routeToShape(pathname: string): Shape {
  if (pathname.startsWith('/login')) return 'login';
  if (pathname === '/' || pathname.startsWith('/inicio')) return 'home';
  if (pathname.startsWith('/configuracion')) return 'settings';
  if (pathname.startsWith('/administracion/usuarios')) return 'table';
  if (pathname.startsWith('/administracion/modulos')) return 'builder';
  if (pathname.startsWith('/administracion/roles')) return 'master-detail';
  if (pathname.startsWith('/administracion/componentes')) return 'components-list';
  return 'generic';
}

export default function ViewSkeleton({
  variant = 'auto',
  className
}: ViewSkeletonProps) {
  const { pathname } = useLocation();
  const shape: Shape =
    variant === 'login'
      ? 'login'
      : variant === 'app'
        ? 'generic'
        : routeToShape(pathname);

  return (
    <div
      role="status"
      aria-label="Cargando"
      aria-busy="true"
      className={cn(
        'fixed inset-0 z-[9999] overflow-hidden bg-page-bg',
        'animate-[fade-in_180ms_ease-out]',
        className
      )}
    >
      {shape === 'login' ? <LoginSkeleton /> : <AppShellSkeleton shape={shape} />}
    </div>
  );
}

// ── App shell común (sidebar + header) + contenido según `shape` ─────

function AppShellSkeleton({ shape }: { shape: Exclude<Shape, 'login'> }) {
  return (
    <div className="grid h-full md:grid-cols-[224px_1fr]">
      <SidebarSkeleton />
      <div className="flex h-full min-w-0 flex-col">
        <HeaderSkeleton />
        <main className="flex-1 overflow-hidden p-3 sm:p-4 lg:p-8">
          {shape === 'home' && <HomeContent />}
          {shape === 'settings' && <SettingsContent />}
          {shape === 'table' && <TableContent />}
          {shape === 'builder' && <BuilderContent />}
          {shape === 'master-detail' && <MasterDetailContent />}
          {shape === 'components-list' && <ComponentsListContent />}
          {shape === 'generic' && <GenericContent />}
        </main>
      </div>
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <aside className="hidden h-full flex-col bg-bg p-3 md:flex">
      <div className="mb-4 flex items-center gap-2 px-2">
        <Skeleton variant="rect" width={28} height={28} />
        <Skeleton variant="text" width={120} height={12} />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center gap-2.5 rounded-md px-3 py-2">
            <Skeleton variant="rect" width={16} height={16} />
            <Skeleton
              variant="text"
              height={11}
              width={`${55 + ((i * 13) % 35)}%`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2.5 rounded-md px-3 py-2">
        <Skeleton variant="rect" width={16} height={16} />
        <Skeleton variant="text" width="55%" height={11} />
      </div>
    </aside>
  );
}

function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 bg-bg px-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:gap-4 md:px-6">
      <Skeleton variant="rect" width={36} height={36} className="shrink-0 md:hidden" />
      <div className="flex flex-1 justify-center">
        <Skeleton variant="text" width={140} height={14} />
      </div>
      <Skeleton variant="rect" height={36} className="hidden md:block md:w-72" />
      <div className="flex shrink-0 items-center gap-2.5">
        <Skeleton variant="circle" width={28} height={28} />
        <div className="hidden flex-col gap-1 md:flex">
          <Skeleton variant="text" width={110} height={10} />
          <Skeleton variant="text" width={70} height={9} />
        </div>
      </div>
    </header>
  );
}

// ── Variantes de contenido ───────────────────────────────────────────

function HomeContent() {
  return (
    <div className="flex h-full items-center justify-center">
      <Skeleton variant="text" width={60} height={13} />
    </div>
  );
}

function GenericContent() {
  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden rounded-xl bg-bg p-5 shadow-sm">
      <div className="flex flex-col gap-2">
        <Skeleton variant="text" width={180} height={16} />
        <Skeleton variant="text" width={240} height={11} />
      </div>
      <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <div
            key={i}
            className="flex min-h-[120px] flex-col gap-3 rounded-lg bg-bg-muted/50 p-4"
          >
            <Skeleton variant="text" width="60%" height={11} />
            <Skeleton variant="text" width="40%" height={20} />
            <div className="mt-auto flex items-center gap-2">
              <Skeleton variant="circle" width={18} height={18} />
              <Skeleton variant="text" width="50%" height={9} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Página con filtros + tabla densa (Usuarios).
function TableContent() {
  return (
    <div className="flex h-full flex-col gap-3 overflow-hidden rounded-xl bg-bg p-5 shadow-sm">
      <div className="flex flex-col gap-2">
        <Skeleton variant="text" width={120} height={16} />
        <Skeleton variant="text" width={180} height={11} />
      </div>
      {/* Encabezado tabla */}
      <div className="mt-3 flex items-center gap-3 border-b border-border-subtle pb-2">
        {[28, 16, 32, 14, 14].map((w, i) => (
          <Skeleton key={i} variant="text" height={9} width={`${w}%`} />
        ))}
      </div>
      {/* Filas */}
      {Array.from({ length: 9 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 py-2">
          <div className="flex w-[28%] items-center gap-2.5">
            <Skeleton variant="circle" width={24} height={24} />
            <Skeleton variant="text" height={11} width="70%" />
          </div>
          <Skeleton variant="text" height={10} width="14%" />
          <Skeleton variant="text" height={10} width="30%" />
          <Skeleton variant="rect" height={18} width="10%" className="rounded-full" />
          <Skeleton variant="text" height={10} width="12%" />
        </div>
      ))}
    </div>
  );
}

// Builder de módulos: dos cards lado a lado (paleta + preview).
function BuilderContent() {
  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden md:flex-row">
      <div className="h-[40%] shrink-0 rounded-xl bg-bg p-4 shadow-sm md:h-auto md:w-[400px]">
        <Skeleton variant="text" width="60%" height={12} />
        <Skeleton variant="text" width="80%" height={10} className="mt-1.5" />
        <div className="mt-4 space-y-1.5">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} variant="rect" height={32} className="w-full rounded-md" />
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col rounded-xl bg-bg p-4 shadow-sm">
        <Skeleton variant="text" width={120} height={12} />
        <Skeleton variant="text" width={220} height={10} className="mt-1.5" />
        <div className="mt-4 space-y-1">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="flex items-center gap-3 px-2 py-2">
              <Skeleton variant="rect" width={17} height={17} />
              <Skeleton
                variant="text"
                height={11}
                width={`${50 + ((i * 17) % 35)}%`}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Lista master + panel detail (Roles).
function MasterDetailContent() {
  return (
    <div className="flex h-full gap-4 overflow-hidden">
      <div className="hidden h-full w-[280px] shrink-0 flex-col rounded-xl bg-bg p-4 shadow-sm md:flex">
        <Skeleton variant="text" width="60%" height={12} />
        <div className="mt-3 space-y-1.5">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} variant="rect" height={34} className="w-full rounded-md" />
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-4 rounded-xl bg-bg p-5 shadow-sm">
        <Skeleton variant="text" width={180} height={16} />
        <Skeleton variant="text" width={260} height={11} />
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <div
              key={i}
              className="flex flex-col gap-2 rounded-lg bg-bg-muted/50 p-3"
            >
              <Skeleton variant="text" width="60%" height={10} />
              <Skeleton variant="rect" height={28} className="w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Página de componentes: secciones verticales apiladas.
function ComponentsListContent() {
  return (
    <div className="h-full overflow-hidden">
      <Skeleton variant="text" width={160} height={20} />
      <Skeleton variant="text" width={220} height={10} className="mt-2" />
      <div className="mt-8 space-y-10">
        {Array.from({ length: 5 }, (_, i) => (
          <section key={i}>
            <Skeleton variant="text" width={140} height={13} />
            <Skeleton variant="rect" height={120} className="mt-3 w-full rounded-lg" />
          </section>
        ))}
      </div>
    </div>
  );
}

// Configuración: tabs/seccions de preferencias.
function SettingsContent() {
  return (
    <div className="h-full overflow-hidden rounded-xl bg-bg p-5 shadow-sm">
      <Skeleton variant="text" width={140} height={16} />
      <Skeleton variant="text" width={220} height={11} className="mt-2" />
      <div className="mt-6 flex gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} variant="rect" height={32} width={92} className="rounded-md" />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg bg-bg-muted/40 p-4">
            <Skeleton variant="text" width="50%" height={11} />
            <Skeleton variant="rect" height={36} className="w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Login ────────────────────────────────────────────────────────────

function LoginSkeleton() {
  return (
    <div className="flex h-full items-center justify-center bg-primary-50 px-4 py-6 md:py-4">
      <div className="w-full max-w-5xl">
        <div className="relative overflow-hidden rounded-[28px] bg-bg shadow-[0_30px_60px_-15px_rgba(0,0,0,0.35)] md:h-[540px] md:grid md:grid-cols-2 md:gap-0">
          <LoginFormSkeleton />
          <div className="hidden p-3 md:block">
            <Skeleton variant="rect" className="h-full w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginFormSkeleton() {
  return (
    <div className="flex flex-col px-6 py-6 sm:px-8 sm:py-7 lg:px-12 md:h-full md:justify-center">
      <div className="mx-auto w-full max-w-[320px] space-y-4">
        <div className="flex flex-col items-center gap-2">
          <Skeleton variant="text" width={200} height={18} />
          <Skeleton variant="text" width={160} height={11} />
        </div>
        <div className="space-y-2">
          <Skeleton variant="text" width={50} height={10} />
          <Skeleton variant="rect" height={40} className="w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton variant="text" width={70} height={10} />
          <Skeleton variant="rect" height={40} className="w-full" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width={100} height={10} />
          <Skeleton variant="text" width={70} height={10} />
        </div>
        <Skeleton variant="rect" height={40} className="w-full" />
        <div className="flex items-center justify-center">
          <Skeleton variant="text" width={100} height={9} />
        </div>
        <Skeleton variant="rect" height={40} className="w-full" />
      </div>
    </div>
  );
}
