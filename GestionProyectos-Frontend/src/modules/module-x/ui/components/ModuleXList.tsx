import ModuleXItem from './ModuleXItem.js';
import type { ModuleX } from '../../domain/module-x.entity.js';

export interface ModuleXListProps {
  items?: ModuleX[];
}

export default function ModuleXList({ items = [] }: ModuleXListProps) {
  if (!items.length) return <p className="text-slate-500">Sin elementos.</p>;
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <ModuleXItem key={String(it.id)} item={it} />
      ))}
    </ul>
  );
}
