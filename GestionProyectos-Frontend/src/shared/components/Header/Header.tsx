import type { SVGProps } from 'react';
import SearchInput from '../SearchInput/index.js';
import UserMenu from '../UserMenu/index.js';
import { useSearch } from '../../search/SearchContext.js';

function MenuIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export interface HeaderProps {
  title?: string;
  displayName?: string;
  role?: string;
  initials?: string;
  onProfile?: () => void;
  onLogout?: () => void;
  onMenu?: () => void;
}

export default function Header({
  title,
  displayName,
  role,
  initials,
  onProfile,
  onLogout,
  onMenu
}: HeaderProps) {
  // Buscador global: el valor vive en SearchContext y cualquier componente
  // (DataTable, sidebar, paletas) lo lee para filtrar su data.  El
  // contexto se resetea solo cuando cambia la ruta.
  const { query, setQuery } = useSearch();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 bg-bg px-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:gap-4 md:px-6">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Abrir menú"
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-fg-muted outline-none transition-colors hover:bg-bg-muted hover:text-fg md:hidden"
      >
        <MenuIcon />
      </button>

      <h1 className="flex-1 truncate text-center text-[16px] font-bold tracking-tight text-primary-700 md:text-[18px]">
        {title ?? 'gestionproyectos'}
      </h1>

      <SearchInput
        className="hidden md:block md:w-72"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <UserMenu
        displayName={displayName}
        role={role}
        initials={initials}
        onProfile={onProfile}
        onLogout={onLogout}
      />
    </header>
  );
}
