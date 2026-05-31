import { useComponentsCatalog } from '../hooks/useComponentsCatalog.jsx';
import { useFilteredList } from '../../../../shared/search/useFilteredList.js';

// Página full-bleed sobre fondo blanco: sin card wrapper, sin overflow lock,
// el scroll lo maneja el <main> de Layout. Cada componente es una sección
// con título y su preview real, separadas por aire.
export default function ComponentsPage() {
  const catalog = useComponentsCatalog();
  // Filtramos por el buscador global del header. Lo hace por nombre del
  // componente — alcanza para ubicar rápido lo que se está buscando.
  const filtered = useFilteredList(catalog, (c) => c.name);

  return (
    <div className="min-h-full bg-bg px-4 py-6 sm:px-8 sm:py-8 lg:px-12 lg:py-10">
      <header className="mb-10">
        <h1 className="text-[22px] font-bold tracking-tight text-fg">
          Componentes
        </h1>
        <p className="mt-1 text-[12px] text-fg-muted">
          {filtered.length === catalog.length
            ? `${catalog.length} componentes de shared/components`
            : `${filtered.length} de ${catalog.length} componentes`}
        </p>
      </header>

      <div className="flex flex-col gap-12">
        {filtered.map((c) => {
          const Preview = c.preview;
          return (
            <section key={c.id}>
              <h2 className="mb-4 text-[15px] font-semibold text-fg">
                {c.name}
              </h2>
              <Preview />
            </section>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-10 text-center text-[13px] text-fg-faint">
            Ningún componente coincide con la búsqueda.
          </p>
        )}
      </div>
    </div>
  );
}
