import HolaItem from './HolaItem.js';
import type { Hola } from '../../domain/hola.entity.js';

export interface HolaListProps {
  items?: Hola[];
}

export default function HolaList({ items = [] }: HolaListProps) {
  if (!items.length) return <p className="text-fg-faint">Sin elementos.</p>;
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <HolaItem key={String(it.id)} item={it} />
      ))}
    </ul>
  );
}
