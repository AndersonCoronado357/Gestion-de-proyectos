// SubmoduleHubPage — hub de UN submódulo. Carga el design_project por
// :id y muestra a la izquierda el árbol de carpetas que tendría
// (ProjectStructureTree), al centro el nombre del submódulo + las 5
// secciones (Front / BD / APIs / Lógica / Permisos). Click en "Front"
// → editor visual a pantalla completa. El footer tiene un único botón
// "Crear submódulo" que aplica TODAS las secciones a disco.

import { useEffect, useState, type ComponentType } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { cn } from '../../../../shared/lib/cn.js';
import Skeleton from '../../../../shared/components/Skeleton/index.js';
import Button from '../../../../shared/components/Button/index.js';
import {
  DatabaseIcon,
  LayoutIcon,
  ZapIcon,
  ApiIcon,
  KeyIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  UploadIcon
} from '../../../../shared/icons/index.js';
import ProjectStructureTree from '../components/ProjectStructureTree.js';
import { useToast } from '../../../../shared/components/Toast/index.js';
import {
  getProject,
  renameProject,
  type DesignProject,
  type DesignProjectWithViews
} from '../../../design/api.js';
import { publishDesign, scaffoldSubmodule } from '../../api.js';
import { appLog } from '../../../logs/logger.js';

interface Section {
  id: 'front' | 'db' | 'apis' | 'logic' | 'perms';
  title: string;
  description: string;
  Icon: ComponentType<{ width?: number; height?: number; strokeWidth?: number }>;
}

const SECTIONS: ReadonlyArray<Section> = [
  {
    id: 'front',
    title: 'Front',
    description: 'Constructor visual de la pantalla.',
    Icon: LayoutIcon
  },
  {
    id: 'db',
    title: 'Base de datos',
    description: 'Tablas, columnas y relaciones del submódulo.',
    Icon: DatabaseIcon
  },
  { id: 'apis', title: 'APIs', description: 'APIs consumidas.', Icon: ApiIcon },
  {
    id: 'logic',
    title: 'Lógica',
    description: 'Conexión del front con el backend.',
    Icon: ZapIcon
  },
  {
    id: 'perms',
    title: 'Permisos',
    description: 'Decidir qué acciones se van a hacer.',
    Icon: KeyIcon
  }
];

export default function SubmoduleHubPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const projectId = id ? Number(id) : null;

  // Si veníamos de la lista (recién creado) o de cualquier nav que
  // adjunte el proyecto vía `state`, pintamos el Hub sin pasar por el
  // skeleton — desempareja la sensación de "se cargó y rebotó".
  const rawSeed = (location.state as { project?: DesignProject } | null)
    ?.project;
  const seed: DesignProjectWithViews | null =
    rawSeed && rawSeed.id === projectId ? { ...rawSeed, views: [] } : null;

  const [project, setProject] = useState<DesignProjectWithViews | null>(seed);
  const [name, setName] = useState(seed ? seed.name : '');
  const [loading, setLoading] = useState(!seed);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState(false);

  // Carga el proyecto al entrar / cambiar de id.
  useEffect(() => {
    if (!projectId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    // Si ya tenemos seed válido NO mostramos skeleton; revalidamos en
    // background sin parpadeo.
    if (!seed) setLoading(true);
    setError(null);
    void (async () => {
      try {
        const p = await getProject(projectId);
        if (cancelled) return;
        if (!p) {
          // Sin seed mostramos error; con seed el usuario YA ve su Hub
          // recién creado — un 404 transitorio no debe sacarlo de ahí.
          if (!seed) setError('Submódulo no encontrado');
          return;
        }
        setProject(p);
        setName(p.name);
      } catch (e) {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'Error';
        // Si ya estamos pintando el seed, la revalidación falló pero el
        // usuario YA ve su Hub — no rompemos la UI con error screen.
        if (!seed) setError(msg);
        appLog.error(`No se pudo cargar el submódulo: ${msg}`, {
          category: 'app',
          loggerName: 'SubmoduleHubPage.loadProject',
          stackTrace: e instanceof Error ? e.stack ?? null : null,
          context: { projectId }
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Persiste renombre al salir del input (blur o Enter).
  const commitRename = async (): Promise<void> => {
    if (!project) return;
    const n = name.trim();
    if (!n || n === project.name) {
      setName(project.name);
      return;
    }
    try {
      const updated = await renameProject(project.id, n);
      if (updated) setProject({ ...project, name: updated.name });
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Inténtalo de nuevo.';
      toast.error({ title: 'No se pudo renombrar', message: msg });
      appLog.error(`No se pudo renombrar el submódulo: ${msg}`, {
        category: 'app',
        loggerName: 'SubmoduleHubPage.commitRename',
        stackTrace: e instanceof Error ? e.stack ?? null : null,
        context: { projectId: project.id, newName: n }
      });
      setName(project.name);
    }
  };

  const openSection = (sectionId: Section['id']): void => {
    if (!project) return;
    if (sectionId === 'front') {
      navigate(`/administracion/diseno/${project.id}`);
    }
    // Las otras secciones todavía no tienen pantalla destino.
  };

  // "Crear submódulo" → acción GLOBAL del hub:
  //   1. Si todavía no existe la estructura hexagonal en disco (proyecto
  //      creado antes de tener el scaffold automático, o el folder fue
  //      borrado a mano), la genera ahora — idempotente, 409 = ya existe.
  //   2. Materializa cada vista del diseño como .tsx dentro del módulo.
  // Cuando se implementen Lógica / APIs / BD / Permisos, esto las va a
  // aplicar también desde el mismo botón.
  const handleSubmoduleSave = async (): Promise<void> => {
    if (!project || publishing) return;
    setPublishing(true);
    try {
      await scaffoldSubmodule(project.name);
      const res = await publishDesign(project.id);
      if (res) {
        toast.success({
          title: 'Submódulo actualizado',
          message: `${res.files.length} archivo${res.files.length === 1 ? '' : 's'} en src/modules/${res.key}/`
        });
      }
      // Soft-nav: la lista se reabre con su `refresh()` propio del
      // useDesignsList al montar, así el card recién publicado aparece
      // con su `updatedAt` fresco sin recargar el bundle.
      navigate('/administracion/submodulos', { replace: true });
      return;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Inténtalo de nuevo.';
      toast.error({ title: 'No se pudo crear el submódulo', message: msg });
      appLog.error(`No se pudo crear el submódulo: ${msg}`, {
        category: 'app',
        loggerName: 'SubmoduleHubPage.handleSubmoduleSave',
        stackTrace: e instanceof Error ? e.stack ?? null : null,
        context: { projectId: project.id, projectName: project.name }
      });
    } finally {
      setPublishing(false);
    }
  };

  if (!projectId) {
    return (
      <div className="flex h-full items-center justify-center text-fg-faint">
        Falta el submódulo. Volvé al{' '}
        <button
          type="button"
          onClick={() => navigate('/administracion/submodulos')}
          className="ml-1 underline outline-none hover:text-fg"
        >
          editor
        </button>
        .
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full gap-4 p-3 sm:p-4 lg:p-6">
        <Skeleton variant="rect" width={300} height="100%" />
        <Skeleton variant="rect" width="100%" height="100%" className="flex-1" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex h-full items-center justify-center text-danger-text">
        {error ?? 'Error cargando el submódulo'}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto bg-page p-4 lg:flex-row lg:overflow-hidden lg:p-6">
      {/* ── Card 1: estructura del proyecto (con botón Volver arriba) ── */}
      <aside className="order-last flex w-full shrink-0 flex-col overflow-hidden rounded-xl bg-bg shadow-sm lg:order-none lg:h-full lg:w-[300px]">
        <ProjectStructureTree
          name={name}
          viewNames={project.views.map((v) => v.name)}
          onBack={() => navigate('/administracion/submodulos')}
        />
      </aside>

      {/* ── Card 2: header (input-título) + opciones ── */}
      <main className="flex w-full flex-col rounded-xl bg-bg shadow-sm lg:min-h-0 lg:flex-1 lg:overflow-hidden">
        <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle px-5 py-3">
          <button
            type="button"
            onClick={() => navigate('/administracion/submodulos')}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-fg-muted outline-none transition-colors hover:bg-bg-muted hover:text-fg lg:hidden"
            title="Volver"
          >
            <ChevronLeftIcon width={14} height={14} />
          </button>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => void commitRename()}
            onKeyDown={(e) => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
              if (e.key === 'Escape') {
                setName(project.name);
                (e.target as HTMLInputElement).blur();
              }
            }}
            placeholder="Nombre del submódulo"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-center text-[13px] font-semibold tracking-tight text-fg outline-none placeholder:font-normal placeholder:text-fg-faint"
          />
        </div>

        <div className="flex flex-col gap-3 p-4 sm:p-5 lg:grid lg:min-h-0 lg:flex-1 lg:grid-rows-5">
          {SECTIONS.map(({ id: sid, title, description, Icon }) => (
            <button
              key={sid}
              type="button"
              onClick={() => openSection(sid)}
              className={cn(
                'group flex w-full items-center gap-5 rounded-xl bg-primary-50 px-5 py-4 text-left outline-none transition-colors duration-150',
                'hover:bg-primary-100/70 dark:bg-primary-500/10 dark:hover:bg-primary-500/20'
              )}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-on-primary shadow-sm">
                <Icon width={18} height={18} strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="text-[14px] font-semibold tracking-tight text-fg">
                  {title}
                </h3>
                <p className="mt-1 text-[12px] text-fg-muted">{description}</p>
              </div>
              <ChevronRightIcon
                width={16}
                height={16}
                className="shrink-0 text-primary-700 transition-transform group-hover:translate-x-0.5"
              />
            </button>
          ))}
        </div>

        {/* Footer global del hub: una única acción que aplica TODAS las
            secciones a disco (hoy solo Front; cuando se sumen Lógica,
            APIs, BD y Permisos, este mismo botón las publica también). */}
        <div className="flex shrink-0 items-center justify-end border-t border-border-subtle px-5 py-3">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<UploadIcon width={13} height={13} />}
            disabled={publishing}
            onClick={() => void handleSubmoduleSave()}
          >
            {publishing ? 'Creando submódulo…' : 'Crear submódulo'}
          </Button>
        </div>
      </main>
    </div>
  );
}
