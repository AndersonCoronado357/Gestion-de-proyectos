import EmptyState from './EmptyState.js';

export const meta = { id: 'empty-state', name: 'EmptyState (vista vacía)' };

export default function EmptyStatePreview() {
  return (
    <EmptyState
      title="Sin resultados"
      description="No hay datos que coincidan con los filtros actuales. Probá ampliar el rango o quitar filtros."
      action={
        <button
          type="button"
          className="rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-on-primary transition-all duration-150 hover:opacity-90 active:scale-95"
        >
          Limpiar filtros
        </button>
      }
    />
  );
}
