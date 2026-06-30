import ModuloDemoItem from './ModuloDemoItem.js';
import type { ModuloDemo } from '../../domain/modulo-demo.entity.js';

export interface ModuloDemoListProps {
  items?: ModuloDemo[];
}

export default function ModuloDemoList({ items = [] }: ModuloDemoListProps) {
  if (!items.length) return <p className="text-fg-faint">Sin elementos.</p>;
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <ModuloDemoItem key={String(it.id)} item={it} />
      ))}
    </ul>
  );
}
