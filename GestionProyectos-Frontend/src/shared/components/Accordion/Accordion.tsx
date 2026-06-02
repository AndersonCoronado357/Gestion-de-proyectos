// Accordion — secciones colapsables. `multiple` permite varias abiertas.

import { useState, type ReactNode } from 'react';
import { cn } from '../../lib/cn.js';

export interface AccordionItem {
  id: string;
  title: ReactNode;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  multiple?: boolean;
  defaultOpen?: string[];
  className?: string;
}

export default function Accordion({
  items,
  multiple = false,
  defaultOpen = [],
  className
}: AccordionProps) {
  const [open, setOpen] = useState<string[]>(defaultOpen);
  const toggle = (id: string) =>
    setOpen((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : multiple
          ? [...prev, id]
          : [id]
    );

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {items.map((it) => {
        const on = open.includes(it.id);
        return (
          <div key={it.id} className="overflow-hidden rounded-xl bg-bg-muted">
            <button
              type="button"
              onClick={() => toggle(it.id)}
              aria-expanded={on}
              className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[13px] font-medium text-fg outline-none"
            >
              {it.title}
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                className={cn(
                  'h-3.5 w-3.5 shrink-0 text-fg-faint transition-transform',
                  on && 'rotate-90'
                )}
              >
                <path d="m9 6 6 6-6 6" />
              </svg>
            </button>
            {on && (
              <div className="px-4 pb-3.5 text-[12.5px] leading-relaxed text-fg-muted">
                {it.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
