import Anderson3Item from './Anderson3Item.js';
import type { Anderson3 } from '../../domain/anderson3.entity.js';

export interface Anderson3ListProps {
  items?: Anderson3[];
}

export default function Anderson3List({ items = [] }: Anderson3ListProps) {
  if (!items.length) return <p className="text-fg-faint">Sin elementos.</p>;
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <Anderson3Item key={String(it.id)} item={it} />
      ))}
    </ul>
  );
}
