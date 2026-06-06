import Anderson4Item from './Anderson4Item.js';
import type { Anderson4 } from '../../domain/anderson4.entity.js';

export interface Anderson4ListProps {
  items?: Anderson4[];
}

export default function Anderson4List({ items = [] }: Anderson4ListProps) {
  if (!items.length) return <p className="text-fg-faint">Sin elementos.</p>;
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <Anderson4Item key={String(it.id)} item={it} />
      ))}
    </ul>
  );
}
