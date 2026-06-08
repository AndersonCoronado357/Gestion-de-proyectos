import { useEffect, useState, type ComponentType } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  type IconProps
} from '../../icons/index.js';
import { cn } from '../../lib/cn.js';

const ChevronLeft = (p: IconProps) => (
  <ChevronLeftIcon width={14} height={14} {...p} />
);
const ChevronRight = (p: IconProps) => (
  <ChevronRightIcon width={14} height={14} {...p} />
);
const ChevronsLeft = (p: IconProps) => (
  <ChevronsLeftIcon width={14} height={14} {...p} />
);
const ChevronsRight = (p: IconProps) => (
  <ChevronsRightIcon width={14} height={14} {...p} />
);

interface NavButtonProps {
  Icon: ComponentType<IconProps>;
  onClick: () => void;
  disabled: boolean;
  label: string;
}

function NavButton({ Icon, onClick, disabled, label }: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className={cn(
        'inline-flex h-7 w-7 items-center justify-center rounded-md outline-none transition-colors',
        'text-fg-muted hover:bg-bg-muted hover:text-fg',
        'disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-fg-muted'
      )}
    >
      <Icon />
    </button>
  );
}

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange
}: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const from = total === 0 ? 0 : safePage * pageSize + 1;
  const to = Math.min((safePage + 1) * pageSize, total);

  const [draft, setDraft] = useState(String(pageSize));
  useEffect(() => {
    setDraft(String(pageSize));
  }, [pageSize]);

  const commitDraft = () => {
    const n = Math.max(1, Math.min(1000, parseInt(draft, 10) || pageSize));
    if (n !== pageSize) onPageSizeChange(n);
    else setDraft(String(pageSize));
  };

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 px-3 py-2.5 sm:flex-nowrap sm:px-5">
      <div className="flex flex-wrap items-center gap-2 text-[11px] text-fg-faint">
        <span className="tabular-nums">
          {from}–{to} de {total}
        </span>
        <span className="hidden sm:inline">·</span>
        <span className="hidden sm:inline">Mostrar</span>
        <input
          type="number"
          min={1}
          max={1000}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commitDraft();
              e.currentTarget.blur();
            }
          }}
          className={cn(
            'h-6 w-12 rounded-md bg-bg-muted px-1.5 text-center text-[11px] tabular-nums text-fg outline-none',
            'transition-colors focus:bg-bg focus:ring-2 focus:ring-primary/15',
            '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
          )}
        />
        <span className="hidden sm:inline">por página</span>
      </div>

      <div className="flex items-center gap-0.5">
        <NavButton
          Icon={ChevronsLeft}
          onClick={() => onPageChange(0)}
          disabled={safePage === 0}
          label="Primera página"
        />
        <NavButton
          Icon={ChevronLeft}
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage === 0}
          label="Anterior"
        />
        <span className="px-2 text-[11.5px] tabular-nums text-fg">
          {safePage + 1} <span className="text-fg-faint">/ {totalPages}</span>
        </span>
        <NavButton
          Icon={ChevronRight}
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages - 1}
          label="Siguiente"
        />
        <NavButton
          Icon={ChevronsRight}
          onClick={() => onPageChange(totalPages - 1)}
          disabled={safePage >= totalPages - 1}
          label="Última página"
        />
      </div>
    </div>
  );
}
