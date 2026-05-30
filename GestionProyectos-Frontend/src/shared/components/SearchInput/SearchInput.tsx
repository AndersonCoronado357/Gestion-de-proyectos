import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn.js';
import { SearchIcon } from '../icons/index.js';
import './SearchInput.css';

export type SearchInputVariant = 'default' | 'on-dark';

const variants: Record<SearchInputVariant, { input: string; icon: string }> = {
  default: {
    input:
      'bg-bg-muted text-fg placeholder:text-fg-faint focus:placeholder:text-transparent',
    icon: 'text-fg-faint'
  },
  'on-dark': {
    input:
      'bg-white/10 text-white placeholder:text-white/55 focus:placeholder:text-transparent caret-white',
    icon: 'text-white/65'
  }
};

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  variant?: SearchInputVariant;
}

const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    { className, placeholder = 'Buscar', variant = 'default', ...props },
    ref
  ) {
    const v = variants[variant];

    return (
      <div className={cn('relative', className)}>
        <SearchIcon
          width={14}
          height={14}
          className={cn(
            'pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2',
            v.icon
          )}
        />
        <input
          ref={ref}
          type="search"
          placeholder={placeholder}
          className={cn(
            'search-clean h-8 w-full rounded-md border-0 pl-8 pr-2.5',
            'text-[12px] font-normal outline-none',
            v.input
          )}
          {...props}
        />
      </div>
    );
  }
);

export default SearchInput;
