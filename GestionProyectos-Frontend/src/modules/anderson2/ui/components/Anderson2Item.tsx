export default function Anderson2Item({ item }) {
  return (
    <li className="rounded border border-border-subtle bg-bg p-3">
      <div className="font-medium">{item.name}</div>
      {item.description && <div className="text-sm text-fg-muted">{item.description}</div>}
    </li>
  );
}
