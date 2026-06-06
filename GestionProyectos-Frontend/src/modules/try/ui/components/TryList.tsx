import TryItem from './TryItem.js';
import type { Try } from '../../domain/try.entity.js';

export interface TryListProps {
  items?: Try[];
}

export default function TryList({ items = [] }: TryListProps) {
  if (!items.length) return <p className="text-fg-faint">Sin elementos.</p>;
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <TryItem key={String(it.id)} item={it} />
      ))}
    </ul>
  );
}
