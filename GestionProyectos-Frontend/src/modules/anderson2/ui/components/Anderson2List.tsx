import Anderson2Item from './Anderson2Item.js';
import type { Anderson2 } from '../../domain/anderson2.entity.js';

export interface Anderson2ListProps {
  items?: Anderson2[];
}

export default function Anderson2List({ items = [] }: Anderson2ListProps) {
  if (!items.length) return <p className="text-fg-faint">Sin elementos.</p>;
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <Anderson2Item key={String(it.id)} item={it} />
      ))}
    </ul>
  );
}
