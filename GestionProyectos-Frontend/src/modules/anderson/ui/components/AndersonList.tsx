import AndersonItem from './AndersonItem.js';
import type { Anderson } from '../../domain/anderson.entity.js';

export interface AndersonListProps {
  items?: Anderson[];
}

export default function AndersonList({ items = [] }: AndersonListProps) {
  if (!items.length) return <p className="text-fg-faint">Sin elementos.</p>;
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <AndersonItem key={String(it.id)} item={it} />
      ))}
    </ul>
  );
}
