// Vista previa — vive dentro del Layout normal. Inyecta el back en el
// header y el selector de vistas (cuando hay más de una). La previa es
// SIEMPRE responsive real: en celular se ve naturalmente en su tamaño
// — sin marco de teléfono ni opciones extras.

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { cn } from '../../../../shared/lib/cn.js';
import Skeleton from '../../../../shared/components/Skeleton/index.js';
import { useHeaderSlot } from '../../../../shared/components/Header/HeaderSlotContext.js';
import ViewRenderer from '../components/ViewRenderer.js';
import {
  getProject,
  type DesignProjectWithViews,
  type DesignView
} from '../../api.js';
import { parseLayout, type LayoutContent } from '../../types.js';

function BackIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const projectId = id ? Number(id) : null;
  const [project, setProject] = useState<DesignProjectWithViews | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeViewId, setActiveViewId] = useState<number | null>(null);

  // ── Header LEADING: back compacto (icon only) ────────────────────
  // En desktop vuelve al editor del diseño. En mobile NO se puede ir
  // al editor (no funciona en celular y rebota automáticamente) — así
  // que sale a la lista de submódulos directamente.
  useHeaderSlot(
    'leading',
    () =>
      projectId ? (
        <button
          type="button"
          onClick={() => {
            if (window.innerWidth < 768) {
              navigate('/administracion/modulos/editor');
            } else {
              navigate(`/administracion/diseno/${projectId}`);
            }
          }}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-fg-muted outline-none transition-colors hover:bg-bg-muted hover:text-fg"
          title="Volver"
          aria-label="Volver"
        >
          <BackIcon />
        </button>
      ) : null,
    [projectId, navigate]
  );

  // ── Header TRAILING: solo el selector de vistas ────────────────
  const views = project?.views ?? [];
  useHeaderSlot(
    'trailing',
    () =>
      views.length > 1 ? (
        <div className="hidden items-center rounded-md bg-bg-muted p-0.5 md:flex">
          {views.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setActiveViewId(v.id)}
              className={cn(
                'inline-flex items-center rounded px-2 py-1 text-[10.5px] font-medium outline-none transition-colors',
                v.id === activeViewId
                  ? 'bg-bg text-fg shadow-sm'
                  : 'text-fg-muted hover:text-fg'
              )}
            >
              {v.name}
            </button>
          ))}
        </div>
      ) : null,
    [views, activeViewId]
  );

  // ── Carga ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        const p = await getProject(projectId);
        if (cancelled) return;
        if (!p) {
          setError('Diseño no encontrado');
          return;
        }
        setProject(p);
        setActiveViewId(p.primaryViewId ?? p.views[0]?.id ?? null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const activeView: DesignView | null = useMemo(
    () => project?.views.find((v) => v.id === activeViewId) ?? null,
    [project, activeViewId]
  );

  const layout: LayoutContent = useMemo(() => {
    if (!activeView) return { blocks: [] };
    return parseLayout(activeView.contentDesktop);
  }, [activeView]);

  if (!projectId) return <div className="p-8 text-fg-faint">Diseño no válido.</div>;
  if (loading) {
    return (
      <div className="flex h-full w-full flex-col gap-3 p-6">
        <Skeleton variant="rect" width="100%" height={400} />
      </div>
    );
  }
  if (error || !project) {
    return <div className="p-8 text-danger-text">{error ?? 'Error'}</div>;
  }

  return (
    <div className="h-full w-full overflow-auto bg-page">
      {activeView == null ? (
        <div className="flex h-full items-center justify-center text-fg-faint">
          Este diseño no tiene vistas.
        </div>
      ) : (
        <div className="h-full w-full">
          <ViewRenderer layout={layout} onNavigate={(vid) => setActiveViewId(vid)} />
        </div>
      )}
    </div>
  );
}
