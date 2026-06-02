import NavigationItem from './NavigationItem.js';
import type { Navigation } from '../../domain/navigation.entity.js';

export interface NavigationListProps {
  items?: Navigation[];
}

export default function NavigationList({ items = [] }: NavigationListProps) {
  if (!items.length) return <p className="text-fg-faint">Sin elementos.</p>;
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <NavigationItem key={String(it.id)} item={it} />
      ))}
    </ul>
  );
}
