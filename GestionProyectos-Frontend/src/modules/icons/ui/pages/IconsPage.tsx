// Página principal del módulo Iconos — galería del catálogo SVG.
// Mismo shell que UsersPage: card único con header + contenido scroll
// + panel lateral de 340px para detalle.

import { useMemo } from 'react';
import { cn } from '../../../../shared/lib/cn.js';
import SearchInput from '../../../../shared/components/SearchInput/index.js';
import EmptyState from '../../../../shared/components/EmptyState/index.js';
import Skeleton from '../../../../shared/components/Skeleton/index.js';
import IconCard from '../components/IconCard.js';
import IconSidePanel from '../components/IconSidePanel.js';
import IconUploadInline from '../components/IconUploadInline.js';
import { useIconsBuilder } from '../hooks/useIconsBuilder.js';

export default function IconsPage() {
  const b = useIconsBuilder();
  const panelOpen = !!b.selected;

  const subtitle = useMemo(() => {
    if (b.error) return b.error;
    if (b.loading) return '';
    return `${b.list.total.toLocaleString()} icono${b.list.total === 1 ? '' : 's'} en el catálogo`;
  }, [b.error, b.loading, b.list.total]);

  return (
    <div className="flex h-full gap-4 overflow-hidden p-3 sm:p-4 lg:p-8">
      <div
        className={cn(
          'flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl bg-bg shadow-sm',
          panelOpen ? 'hidden md:flex' : 'flex'
        )}
      >
        <div className="shrink-0 px-4 pt-4 pb-1 sm:px-5 sm:pt-5">
          <h2 className="text-[18px] font-bold tracking-tight text-fg">Iconos</h2>
          {b.loading ? (
            <Skeleton variant="text" width={140} height={11} className="mt-0.5" />
          ) : (
            <p
              className={cn(
                'mt-0.5 text-[11px]',
                b.error ? 'text-danger-text' : 'text-fg-faint'
              )}
            >
              {subtitle}
            </p>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4 sm:px-5 sm:pb-5">
          <div className="flex flex-col gap-4">
            <IconUploadInline
              busy={b.busy}
              onUpload={async (input) => {
                await b.upload(input);
              }}
            />

            <div className="flex flex-wrap items-center gap-2">
              <SearchInput
                value={b.search}
                onChange={(e) => b.setSearch(e.target.value)}
                placeholder="Buscar por nombre"
                className="min-w-[220px] flex-1"
              />
            </div>

            {b.loading ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                {Array.from({ length: 16 }).map((_, i) => (
                  <Skeleton key={i} variant="rect" width="100%" height={86} />
                ))}
              </div>
            ) : b.list.items.length === 0 ? (
              <EmptyState
                title="Sin iconos"
                description={
                  b.search
                    ? 'Ningún icono coincide con la búsqueda.'
                    : 'Pegá un SVG arriba para empezar el catálogo.'
                }
              />
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                {b.list.items.map((icon) => (
                  <IconCard
                    key={icon.id}
                    icon={icon}
                    selected={b.selected?.id === icon.id}
                    onSelect={() => b.setSelected(icon)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {panelOpen && b.selected && (
        <div className="flex h-full w-full min-w-0 flex-col overflow-hidden rounded-xl bg-bg shadow-sm md:w-[360px] md:flex-none md:shrink-0">
          <IconSidePanel
            icon={b.selected}
            busy={b.busy}
            onClose={() => b.setSelected(null)}
            onRename={b.rename}
            onUpdateSvg={b.updateSvg}
            onDelete={b.remove}
          />
        </div>
      )}
    </div>
  );
}
