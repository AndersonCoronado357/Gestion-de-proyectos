// Tabs — pestañas para alternar vistas. Controlado (value/onChange) o no
// (defaultValue). Si los items traen `content`, lo renderiza debajo.

import { useState, type ReactNode } from 'react';
import { cn } from '../../lib/cn.js';

export interface TabItem {
  id: string;
  label: ReactNode;
  content?: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (id: string) => void;
  className?: string;
}

export default function Tabs({ items, value, defaultValue, onChange, className }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue ?? items[0]?.id ?? '');
  const active = value ?? internal;
  const setActive = (id: string) => {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  };
  const current = items.find((i) => i.id === active);

  return (
    <div className={cn('w-full', className)}>
      <div className="flex gap-1 border-b border-border-subtle" role="tablist">
        {items.map((it) => {
          const on = it.id === active;
          return (
            <button
              key={it.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setActive(it.id)}
              className={cn(
                'relative -mb-px px-3.5 py-2 text-[13px] font-medium outline-none transition-colors duration-200',
                on ? 'text-primary' : 'text-fg-muted hover:text-fg'
              )}
            >
              {it.label}
              {/* Underline siempre presente. Se "expande" desde el centro con
                  scale-x al activarse → animación suave entre tabs. */}
              <span
                className={cn(
                  'absolute inset-x-2 -bottom-px h-0.5 origin-center rounded-full bg-primary transition-transform duration-200 ease-out',
                  on ? 'scale-x-100' : 'scale-x-0'
                )}
              />
            </button>
          );
        })}
      </div>
      {current?.content != null && (
        <div className="pt-4" role="tabpanel">
          {current.content}
        </div>
      )}
    </div>
  );
}
