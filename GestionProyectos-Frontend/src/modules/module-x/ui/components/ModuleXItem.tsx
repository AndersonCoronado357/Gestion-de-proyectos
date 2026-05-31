export default function ModuleXItem({ item }) {
  return (
    <li className="rounded border border-slate-200 bg-white p-3">
      <div className="font-medium">{item.name}</div>
      {item.description && <div className="text-sm text-slate-600">{item.description}</div>}
    </li>
  );
}
