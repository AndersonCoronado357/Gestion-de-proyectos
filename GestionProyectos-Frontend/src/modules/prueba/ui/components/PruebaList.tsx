import PruebaItem from './PruebaItem.js';
import type { Prueba } from '../../domain/prueba.entity.js';

export interface PruebaListProps {
  items?: Prueba[];
}

export default function PruebaList({ items = [] }: PruebaListProps) {
  if (!items.length) return <p className="text-fg-faint">Sin elementos.</p>;
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <PruebaItem key={String(it.id)} item={it} />
      ))}
    </ul>
  );
}
