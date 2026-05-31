import { useEffect, useMemo, useState, type SVGProps } from 'react';
import { cn } from '../../../../shared/lib/cn.js';
import { TrashIcon } from '../../../../shared/components/icons/index.js';
import SearchInput from '../../../../shared/components/SearchInput/index.js';
import ModuleSection from './ModuleSection.js';
import CargosList from './CargosList.js';
import { PERMISSION_ACTIONS } from '../../domain/permission.value-objects.js';
import {
  isPlaceholderRoleName,
  type RoleEntry
} from '../hooks/useRolesBuilder.js';
import type { ResourceModule } from '../hooks/useResources.js';

function BackIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="m15 18-6-6 6-6" />
    </svg>
  );
}

export interface RoleDetailViewProps {
  role: RoleEntry;
  resourceTree: ResourceModule[];
  /** Catálogo de cargos disponibles (viene del backend). */
  cargos: ReadonlyArray<{ id: string; label: string }>;
  /** Si false, inputs y toggles quedan read-only para roles existentes. */
  canEdit?: boolean;
  /**
   * Si true, el usuario puede editar el rol que acaba de crear EN ESTA
   * SESIÓN (combinar con `isNewCreation`).  En cuanto el usuario sale
   * del detalle del rol recién creado y vuelve, se considera "existente"
   * y pasa a requerir `canEdit`.
   */
  canCreate?: boolean;
  /** Si false, no se muestra el botón de eliminar. */
  canDelete?: boolean;
  /** True si este rol fue creado por el usuario en esta sesión. */
  isNewCreation?: boolean;
  onUpdate: (id: string, patch: Partial<RoleEntry>) => void;
  onTogglePermission: (
    roleId: string,
    resourceId: string,
    action: string
  ) => void;
  onToggleSubmoduleAll: (roleId: string, submoduleId: string) => void;
  onToggleModuleAll: (roleId: string, submoduleIds: string[]) => void;
  onToggleGlobalAll: (roleId: string, allSubmoduleIds: string[]) => void;
  onToggleCargo: (roleId: string, cargoId: string) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

export default function RoleDetailView({
  role,
  resourceTree,
  cargos,
  canEdit = true,
  canCreate = true,
  canDelete = true,
  isNewCreation = false,
  onUpdate,
  onTogglePermission,
  onToggleSubmoduleAll,
  onToggleModuleAll,
  onToggleGlobalAll,
  onToggleCargo,
  onDelete,
  onBack
}: RoleDetailViewProps) {
  // Con sólo `create`, el usuario puede terminar de configurar el rol que
  // acaba de crear en esta sesión (nombre + descripción + permisos).  Si
  // sale del detalle y vuelve, `isNewCreation` se va a false → bloqueado.
  const effectiveCanEdit = canEdit || (canCreate && isNewCreation);
  // Si el rol todavía tiene el nombre placeholder de "recién creado",
  // mostramos los inputs vacíos para que el usuario ponga el real.
  const displayedName = isPlaceholderRoleName(role.name) ? '' : role.name;
  const [name, setName] = useState(displayedName);
  const [description, setDescription] = useState(role.description);
  const [query, setQuery] = useState('');
  const [onlyAssigned, setOnlyAssigned] = useState(false);

  useEffect(() => {
    setName(isPlaceholderRoleName(role.name) ? '' : role.name);
    setDescription(role.description);
  }, [role.id, role.name]);

  const commitName = () => {
    const trimmed = name.trim();
    // No persistimos un nombre vacío: si el usuario blur con el input
    // todavía vacío, dejamos el placeholder en DB (invisible) y volvemos
    // a mostrar el input vacío en pantalla.
    if (!trimmed) {
      setName('');
      return;
    }
    if (trimmed !== role.name) onUpdate(role.id, { name: trimmed });
  };

  const commitDescription = () => {
    if (description !== role.description) {
      onUpdate(role.id, { description });
    }
  };

  const allSubmoduleIds = useMemo(
    () => resourceTree.flatMap((m) => m.submodules.map((s) => s.id)),
    [resourceTree]
  );

  const totals = useMemo(() => {
    let assignedSubs = 0;
    let grants = 0;
    Object.values(role.permissions).forEach((p) => {
      const c = PERMISSION_ACTIONS.filter((a) => p[a.id]).length;
      if (c > 0) {
        assignedSubs += 1;
        grants += c;
      }
    });
    const fullyGranted =
      allSubmoduleIds.length > 0 &&
      allSubmoduleIds.every((sid) => {
        const p = role.permissions[sid];
        return p && PERMISSION_ACTIONS.every((a) => p[a.id]);
      });
    return { assignedSubs, grants, fullyGranted };
  }, [role.permissions, allSubmoduleIds]);

  const filteredTree = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resourceTree
      .map((m) => {
        const subs = m.submodules.filter((s) => {
          if (q && !s.label.toLowerCase().includes(q)) return false;
          if (onlyAssigned) {
            const perms = role.permissions[s.id];
            if (!perms) return false;
            if (!PERMISSION_ACTIONS.some((a) => perms[a.id])) return false;
          }
          return true;
        });
        return { ...m, submodules: subs };
      })
      .filter((m) => m.submodules.length > 0);
  }, [resourceTree, query, onlyAssigned, role.permissions]);

  return (
    <div className="flex h-full flex-col overflow-y-auto md:overflow-hidden animate-[fade-in_180ms_ease-out]">
      <div className="flex shrink-0 items-center gap-2 px-5 py-3">
        <button
          type="button"
          onClick={onBack}
          className={cn(
            'inline-flex h-8 items-center gap-1 rounded-md px-2 text-[12px] font-medium outline-none transition-colors',
            'text-fg-muted hover:bg-bg-muted hover:text-fg'
          )}
        >
          <BackIcon />
          Roles
        </button>
        <span className="text-fg-faint">/</span>
        <span className="truncate text-[12px] font-semibold text-fg">
          {displayedName}
        </span>
        {role.isSuper ? (
          <span
            className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-50 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wider text-primary-700 dark:bg-primary-500/15 dark:text-primary-300"
            title="Rol del sistema — acceso total automático"
          >
            Sistema
          </span>
        ) : canDelete ? (
          <button
            type="button"
            onClick={() => onDelete(role.id)}
            title="Eliminar rol"
            className={cn(
              'ml-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md outline-none transition',
              'text-fg-faint hover:bg-red-50 hover:text-red-600',
              'dark:hover:bg-red-500/15 dark:hover:text-red-400'
            )}
          >
            <TrashIcon width={14} height={14} />
          </button>
        ) : null}
      </div>

      <div className="h-px shrink-0 bg-border-subtle" />

      <div className="flex min-h-0 flex-1 flex-col animate-[slide-up-fade_220ms_ease-out] md:flex-row md:overflow-hidden">
        {/* 1/3 — identidad del rol + cargos. En móvil ocupa todo el ancho
            y se apila arriba; en md+ vuelve al split de 1/3 con overflow
            propio para que sólo scrollee internamente. */}
        <div className="flex w-full shrink-0 flex-col gap-4 px-5 py-5 md:w-1/3 md:min-w-[260px] md:overflow-hidden">
          <div className="shrink-0">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={commitName}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              placeholder="Nombre del rol"
              readOnly={!effectiveCanEdit}
              className="w-full bg-transparent text-[20px] font-bold tracking-tight text-fg outline-none placeholder:font-normal placeholder:text-fg-faint read-only:cursor-default"
            />
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onBlur={commitDescription}
              onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
              placeholder="Añade una descripción"
              readOnly={!effectiveCanEdit}
              className="mt-1 w-full bg-transparent text-[12.5px] text-fg-muted outline-none placeholder:text-fg-faint read-only:cursor-default"
            />
            <div className="mt-3 flex items-center gap-2 text-[11px] text-fg-faint">
              {role.isSuper ? (
                <span className="rounded-full bg-primary-50 px-2 py-0.5 font-semibold text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
                  Acceso total
                </span>
              ) : (
                <>
                  <span className="rounded-full bg-bg-muted px-2 py-0.5 font-medium tabular-nums">
                    {totals.assignedSubs} submódulos
                  </span>
                  <span className="rounded-full bg-bg-muted px-2 py-0.5 font-medium tabular-nums">
                    {totals.grants} permisos
                  </span>
                  <span className="rounded-full bg-bg-muted px-2 py-0.5 font-medium tabular-nums">
                    {role.cargos?.length ?? 0} cargos
                  </span>
                </>
              )}
            </div>
          </div>

          {!role.isSuper && (
            <>
              <div className="h-px shrink-0 bg-border-subtle" />
              <CargosList
                options={cargos}
                assigned={role.cargos ?? []}
                onToggle={
                  effectiveCanEdit
                    ? (cargoId) => onToggleCargo(role.id, cargoId)
                    : () => {}
                }
              />
            </>
          )}
        </div>

        {/* Divisor: horizontal en móvil, vertical en md+ */}
        <div className="h-px w-full shrink-0 bg-border-subtle md:h-auto md:w-px" />

        {/* 2/3 — recursos y permisos.  Para roles `isSuper` reemplazamos
            todo el panel por un banner: los permisos son implícitos y
            cualquier control acá sería engañoso (el backend los ignora). */}
        {role.isSuper ? (
          <div className="flex min-w-0 flex-1 items-center justify-center px-6 py-10">
            <div className="max-w-md rounded-xl border border-primary-100 bg-primary-50 px-5 py-6 text-center dark:border-primary-500/20 dark:bg-primary-500/10">
              <p className="text-[13px] font-semibold text-primary-700 dark:text-primary-200">
                Acceso total automático
              </p>
              <p className="mt-1.5 text-[12px] leading-relaxed text-primary-700/80 dark:text-primary-200/80">
                Este rol concede acceso a todos los módulos y submódulos
                del sistema, incluyendo los que se creen en el futuro.
                No es necesario (ni posible) asignarle permisos o cargos
                manualmente.
              </p>
            </div>
          </div>
        ) : (
        <div className="flex min-w-0 flex-1 flex-col md:overflow-hidden">
          <div className="flex shrink-0 flex-wrap items-center gap-2 px-3 py-3 sm:flex-nowrap sm:px-5">
            <div className="w-full sm:w-auto sm:flex-1">
              <SearchInput
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar submódulo"
              />
            </div>
            <button
              type="button"
              onClick={() => setOnlyAssigned((v) => !v)}
              className={cn(
                'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-3 text-[11.5px] font-medium outline-none transition-colors',
                onlyAssigned
                  ? 'bg-primary text-on-primary hover:bg-primary-700'
                  : 'bg-bg-muted text-fg-muted hover:bg-primary-50 hover:text-primary-700'
              )}
            >
              Solo asignados
              <span
                className={cn(
                  'rounded-full px-1.5 py-px text-[10px] tabular-nums',
                  onlyAssigned ? 'bg-on-primary/15' : 'bg-bg text-fg-faint'
                )}
              >
                {totals.assignedSubs}
              </span>
            </button>
            {effectiveCanEdit && (
              <button
                type="button"
                onClick={() => onToggleGlobalAll(role.id, allSubmoduleIds)}
                title="Conceder todos los permisos"
                className={cn(
                  'inline-flex h-8 shrink-0 items-center rounded-full px-3 text-[11px] font-medium outline-none transition-colors duration-150',
                  totals.fullyGranted
                    ? 'bg-primary text-on-primary hover:bg-primary-700'
                    : 'bg-bg-muted text-fg-subtle hover:bg-primary-50 hover:text-primary-700'
                )}
              >
                Conceder todo
              </button>
            )}
          </div>

          <div className="min-h-0 flex-1 px-3 pb-4 md:overflow-y-auto">
            {filteredTree.length === 0 ? (
              <p className="px-3 py-8 text-center text-[12px] text-fg-faint">
                {onlyAssigned && totals.assignedSubs === 0
                  ? 'Este rol todavía no tiene permisos'
                  : 'Sin coincidencias'}
              </p>
            ) : (
              <ul className="flex flex-col gap-0.5">
                {filteredTree.map((m, i) => (
                  <ModuleSection
                    // El sufijo del key fuerza remount al alternar
                    // "Solo asignados": queremos que todas las secciones
                    // vuelvan a su estado por defecto (colapsadas).
                    key={`${m.id}-${onlyAssigned ? 'a' : 'n'}`}
                    module={m}
                    permissions={role.permissions}
                    defaultOpen={!onlyAssigned && !!query}
                    onTogglePermission={
                      effectiveCanEdit
                        ? (submoduleId, action) =>
                            onTogglePermission(role.id, submoduleId, action)
                        : () => {}
                    }
                    onToggleSubmoduleAll={
                      effectiveCanEdit
                        ? (submoduleId) =>
                            onToggleSubmoduleAll(role.id, submoduleId)
                        : () => {}
                    }
                    onToggleModuleAll={
                      effectiveCanEdit
                        ? (submoduleIds) => onToggleModuleAll(role.id, submoduleIds)
                        : () => {}
                    }
                    className="animate-[slide-up-fade_220ms_ease-out_both]"
                    style={{ animationDelay: `${i * 25}ms` }}
                  />
                ))}
              </ul>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
