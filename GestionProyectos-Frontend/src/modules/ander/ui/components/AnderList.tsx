import AnderItem from './AnderItem.js';
import type { Ander } from '../../domain/ander.entity.js';

export interface AnderListProps {
  items?: Ander[];
}

export default function AnderList({ items = [] }: AnderListProps) {
  if (!items.length) return <p className="text-fg-faint">Sin elementos.</p>;
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <AnderItem key={String(it.id)} item={it} />
      ))}
    </ul>
  );
}
