import PreferencesItem from './PreferencesItem.js';
import type { Preferences } from '../../domain/preferences.entity.js';

export interface PreferencesListProps {
  items?: Preferences[];
}

export default function PreferencesList({ items = [] }: PreferencesListProps) {
  if (!items.length) return <p className="text-fg-faint">Sin elementos.</p>;
  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <PreferencesItem key={String(it.id)} item={it} />
      ))}
    </ul>
  );
}
