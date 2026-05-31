// Estado y operaciones del builder del sidebar.
//
//   - Hidrata del NavigationContext en la carga inicial.
//   - Cada mutación local marca `dirty`.  Tras 700ms sin nuevos cambios,
//     dispara auto-save contra el backend.  El backend broadcastea por
//     SSE, así que cualquier otro cliente conectado refresca el sidebar
//     sin recargar.
//   - El `id` local de cada módulo/submódulo es estable: nunca se deriva
//     del `serverId`.  Al guardar, sólo se actualizan los `serverId`
//     in-place — el input del usuario no pierde foco aunque la respuesta
//     traiga IDs nuevos.
//   - Si entra una tree por SSE proveniente de OTRO cliente, sólo se
//     aplica cuando el builder local está limpio (sin edits pendientes),
//     para no pisar lo que está editando el usuario actual.

import { useEffect, useRef, useState } from 'react';
import { useNavigationTree } from '../../../navigation/NavigationContext.js';
import type {
  IdMap,
  ModuleNode,
  NavigationTreeInput
} from '../../../navigation/domain/navigation.types.js';

export type MovePosition = 'before' | 'after';
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

// Debounce corto: el usuario debe sentir que cualquier cambio se guarda
// "casi al instante" pero sin saturar al server con un POST por keystroke.
const AUTOSAVE_DEBOUNCE_MS = 350;
const SAVED_FLASH_MS = 1200;

export interface Submodule {
  id: string;
  serverId: number | null;
  folderId: string;
  name: string;
  iconSvg: string | null;
  path: string | null;
}

export interface ModuleEntry {
  id: string;
  serverId: number | null;
  name: string;
  iconSvg: string | null;
  submodules: Submodule[];
}

export interface UseBuilderResult {
  modules: ModuleEntry[];
  loading: boolean;
  saveStatus: SaveStatus;
  saveError: string | null;
  usedFolderIds: Set<string>;
  folderUsage: Record<string, string>;
  addModule: (name?: string) => void;
  removeModule: (id: string) => void;
  renameModule: (id: string, name: string) => void;
  setModuleIcon: (id: string, iconSvg: string | null) => void;
  addSubmodule: (moduleId: string, folderId: string, label: string) => void;
  removeSubmodule: (moduleId: string, subId: string) => void;
  renameSubmodule: (moduleId: string, subId: string, name: string) => void;
  setSubmoduleIcon: (
    moduleId: string,
    subId: string,
    iconSvg: string | null
  ) => void;
  moveModule: (fromId: string, toId: string, position?: MovePosition) => void;
  moveSubmodule: (
    moduleId: string,
    fromSubId: string,
    toSubId: string,
    position?: MovePosition
  ) => void;
  moveSubmoduleAcross: (
    fromModId: string,
    toModId: string,
    subId: string,
    overSubId: string | null
  ) => void;
}

const uid = (): string => `local-${Math.random().toString(36).slice(2, 9)}`;

// URL-friendly: saca tildes, baja a minúsculas, espacios → guiones.
// Vale para nombres de módulo en español (Administración → administracion).
function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-zA-Z0-9\s_-]/g, '')
    .trim()
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
}

// Path canónico: `/<modulo>/<submodulo>`.  El slug del submódulo sale del
// folderId (estable) — el name puede cambiar y romper la URL si lo usamos.
// El slug del módulo sale del name (es lo único que tenemos a mano y es
// lo que se ve en el sidebar).
function buildSubmodulePath(moduleName: string, folderId: string): string {
  const mod = slugify(moduleName) || 'modulo';
  const sub = slugify(folderId) || 'submodulo';
  return `/${mod}/${sub}`;
}

function hydrate(tree: ModuleNode[]): ModuleEntry[] {
  return tree.map((m) => ({
    id: uid(),
    serverId: m.id,
    name: m.name,
    iconSvg: m.icon,
    submodules: m.submodules.map((s) => ({
      id: uid(),
      serverId: s.id,
      folderId: s.folderKey ?? `srv-${s.id}`,
      name: s.name,
      iconSvg: s.icon,
      path: s.path
    }))
  }));
}

function toPayload(modules: ModuleEntry[]): NavigationTreeInput {
  return modules.map((m) => ({
    id: m.serverId,
    // Mandamos el id LOCAL como clientId sólo cuando aún no hay serverId.
    // Así el server lo echoa en idMap y sabemos exactamente qué item
    // local recibió qué serverId — sin tener que matchear por posición.
    clientId: m.serverId === null ? m.id : null,
    name: m.name,
    icon: m.iconSvg,
    submodules: m.submodules.map((s) => ({
      id: s.serverId,
      clientId: s.serverId === null ? s.id : null,
      name: s.name,
      icon: s.iconSvg,
      path: s.path,
      folderKey: s.folderId.startsWith('srv-') ? null : s.folderId
    }))
  }));
}

// Aplica los serverIds devueltos por el backend a los items locales que
// estaban marcados como "nuevos" (clientId enviado).  Matchea por id
// local — robusto a que el usuario haya reordenado/movido cosas mientras
// el save estaba en vuelo.
//
// Devuelve la misma referencia si nada cambió → React skipea el render
// y no se interrumpen drags ni inputs activos.
function applyIdMap(local: ModuleEntry[], idMap: IdMap): ModuleEntry[] {
  let anyChanged = false;
  const next = local.map((mod) => {
    let modChanged = false;
    let nextServerId = mod.serverId;
    if (nextServerId === null) {
      const assigned = idMap.modules[mod.id];
      if (typeof assigned === 'number') {
        nextServerId = assigned;
        modChanged = true;
      }
    }

    let subsChanged = false;
    const newSubs = mod.submodules.map((sub) => {
      if (sub.serverId !== null) return sub;
      const assigned = idMap.submodules[sub.id];
      if (typeof assigned !== 'number') return sub;
      subsChanged = true;
      return { ...sub, serverId: assigned };
    });

    if (!modChanged && !subsChanged) return mod;
    anyChanged = true;
    return {
      ...mod,
      serverId: nextServerId,
      submodules: subsChanged ? newSubs : mod.submodules
    };
  });
  return anyChanged ? next : local;
}

// Convierte una `NavigationTree` (lo que viene del server) al mismo
// formato JSON que `toPayload` para poder comparar por igualdad de
// strings y detectar "es nuestro propio echo" en el SSE.
function treeToBaselineString(tree: ModuleNode[]): string {
  return JSON.stringify(
    tree.map((m) => ({
      id: m.id,
      clientId: null,
      name: m.name,
      icon: m.icon,
      submodules: m.submodules.map((s) => ({
        id: s.id,
        clientId: null,
        name: s.name,
        icon: s.icon,
        path: s.path,
        folderKey: s.folderKey
      }))
    }))
  );
}

// Versión de toPayload que normaliza los clientId a null para comparar
// contra `treeToBaselineString` sin diferencias accidentales.
function toBaselineString(modules: ModuleEntry[]): string {
  return JSON.stringify(
    modules.map((m) => ({
      id: m.serverId,
      clientId: null,
      name: m.name,
      icon: m.iconSvg,
      submodules: m.submodules.map((s) => ({
        id: s.serverId,
        clientId: null,
        name: s.name,
        icon: s.iconSvg,
        path: s.path,
        folderKey: s.folderId.startsWith('srv-') ? null : s.folderId
      }))
    }))
  );
}

export function useBuilder(): UseBuilderResult {
  const { tree, loading, save: persistTree } = useNavigationTree();
  const [modules, setModules] = useState<ModuleEntry[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  // Snapshot del último estado conocido (lo que está en server). Sirve
  // como referencia para saber si hay cambios pendientes Y para decidir
  // si una tree de SSE pisa la nuestra (sólo si NO hay cambios locales).
  const baselineRef = useRef<string>('[]');
  const hydratedRef = useRef<boolean>(false);
  // Ref del último `modules` para que los effects no dependan del state
  // y caigan en bucle al actualizarse.
  const modulesRef = useRef<ModuleEntry[]>(modules);
  useEffect(() => {
    modulesRef.current = modules;
  }, [modules]);

  // Carga inicial / re-hidratación cuando la tree del contexto cambia
  // POR FUERA de nuestros propios saves (otro cliente editó vía SSE).
  useEffect(() => {
    if (loading) return;
    if (!hydratedRef.current) {
      const hydrated = hydrate(tree);
      setModules(hydrated);
      baselineRef.current = treeToBaselineString(tree);
      hydratedRef.current = true;
      return;
    }
    const incomingBaseline = treeToBaselineString(tree);
    // Si el árbol entrante coincide con nuestro último baseline guardado,
    // es nuestro propio echo — no hacemos nada.
    if (incomingBaseline === baselineRef.current) return;
    // Si el usuario tiene cambios locales sin sincronizar, no piso su
    // edición; el próximo auto-save mandará todo y se reconcilia.
    const currentLocal = toBaselineString(modulesRef.current);
    if (currentLocal !== baselineRef.current) return;

    const hydrated = hydrate(tree);
    setModules(hydrated);
    baselineRef.current = incomingBaseline;
  }, [tree, loading]);

  // Auto-save debounced. Cada mutación local arranca un timer corto;
  // el último gana. Mientras el usuario sigue editando, no hay re-renders
  // por status — sólo cambia cuando el save efectivamente arranca.
  useEffect(() => {
    if (!hydratedRef.current) return;
    const current = toBaselineString(modules);
    if (current === baselineRef.current) return;
    const timer = window.setTimeout(async () => {
      setSaveStatus('saving');
      setSaveError(null);
      try {
        const result = await persistTree(toPayload(modulesRef.current));
        // applyIdMap matchea por id local → robusto a edits durante el
        // save. Si nada cambió, devuelve la misma ref → React skipea
        // el render, drag/input siguen activos.
        const next = applyIdMap(modulesRef.current, result.idMap);
        if (next !== modulesRef.current) setModules(next);
        // Baseline = vista del servidor.  Si local difiere (porque el
        // usuario editó durante el save), el próximo cambio dispara
        // un nuevo auto-save que reconcilia.
        baselineRef.current = treeToBaselineString(result.tree);
        setSaveStatus('saved');
        window.setTimeout(() => {
          setSaveStatus((s) => (s === 'saved' ? 'idle' : s));
        }, SAVED_FLASH_MS);
      } catch (e) {
        setSaveError(
          e instanceof Error ? e.message : 'No se pudo guardar el árbol.'
        );
        setSaveStatus('error');
      }
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [modules, persistTree]);

  // ── Mutadores ─────────────────────────────────────────────────────

  const addModule: UseBuilderResult['addModule'] = (name) => {
    setModules((prev) => [
      ...prev,
      {
        id: uid(),
        serverId: null,
        name: name || 'Nuevo módulo',
        iconSvg: null,
        submodules: []
      }
    ]);
  };

  const removeModule: UseBuilderResult['removeModule'] = (id) =>
    setModules((prev) => prev.filter((m) => m.id !== id));

  // Al renombrar el módulo regeneramos el path de TODOS sus submódulos
  // para que el slug del módulo en la URL siga su nombre actual.
  const renameModule: UseBuilderResult['renameModule'] = (id, name) =>
    setModules((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              name,
              submodules: m.submodules.map((s) => ({
                ...s,
                path: buildSubmodulePath(name, s.folderId)
              }))
            }
          : m
      )
    );

  const setModuleIcon: UseBuilderResult['setModuleIcon'] = (id, iconSvg) =>
    setModules((prev) =>
      prev.map((m) => (m.id === id ? { ...m, iconSvg } : m))
    );

  const addSubmodule: UseBuilderResult['addSubmodule'] = (
    moduleId,
    folderId,
    label
  ) => {
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              submodules: m.submodules.some((s) => s.folderId === folderId)
                ? m.submodules
                : [
                    ...m.submodules,
                    {
                      id: uid(),
                      serverId: null,
                      folderId,
                      name: label,
                      iconSvg: null,
                      path: buildSubmodulePath(m.name, folderId)
                    }
                  ]
            }
          : m
      )
    );
  };

  const removeSubmodule: UseBuilderResult['removeSubmodule'] = (
    moduleId,
    subId
  ) =>
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? { ...m, submodules: m.submodules.filter((s) => s.id !== subId) }
          : m
      )
    );

  const setSubmoduleIcon: UseBuilderResult['setSubmoduleIcon'] = (
    moduleId,
    subId,
    iconSvg
  ) =>
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              submodules: m.submodules.map((s) =>
                s.id === subId ? { ...s, iconSvg } : s
              )
            }
          : m
      )
    );

  const renameSubmodule: UseBuilderResult['renameSubmodule'] = (
    moduleId,
    subId,
    name
  ) =>
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              submodules: m.submodules.map((s) =>
                s.id === subId ? { ...s, name } : s
              )
            }
          : m
      )
    );

  const moveSubmodule: UseBuilderResult['moveSubmodule'] = (
    moduleId,
    fromSubId,
    toSubId,
    position = 'before'
  ) => {
    if (fromSubId === toSubId) return;
    setModules((prev) =>
      prev.map((m) => {
        if (m.id !== moduleId) return m;
        const fromIdx = m.submodules.findIndex((s) => s.id === fromSubId);
        const toIdx = m.submodules.findIndex((s) => s.id === toSubId);
        if (fromIdx < 0 || toIdx < 0) return m;
        const next = [...m.submodules];
        const [moved] = next.splice(fromIdx, 1);
        if (!moved) return m;
        const adjusted = fromIdx < toIdx ? toIdx - 1 : toIdx;
        const insertAt = position === 'after' ? adjusted + 1 : adjusted;
        next.splice(insertAt, 0, moved);
        return { ...m, submodules: next };
      })
    );
  };

  const moveSubmoduleAcross: UseBuilderResult['moveSubmoduleAcross'] = (
    fromModId,
    toModId,
    subId,
    overSubId
  ) => {
    setModules((prev) => {
      const fromMod = prev.find((m) => m.id === fromModId);
      const sub = fromMod?.submodules.find((s) => s.id === subId);
      if (!sub) return prev;
      const toMod = prev.find((m) => m.id === toModId);
      if (toMod?.submodules.some((s) => s.folderId === sub.folderId)) {
        return prev;
      }
      // Al mover entre módulos, regeneramos el path con el slug del
      // módulo destino para que la URL refleje la nueva ubicación.
      const rebased: Submodule = {
        ...sub,
        path: toMod ? buildSubmodulePath(toMod.name, sub.folderId) : sub.path
      };
      return prev.map((m) => {
        if (m.id === fromModId) {
          return {
            ...m,
            submodules: m.submodules.filter((s) => s.id !== subId)
          };
        }
        if (m.id === toModId) {
          const next = [...m.submodules];
          if (overSubId) {
            const idx = next.findIndex((s) => s.id === overSubId);
            if (idx >= 0) next.splice(idx, 0, rebased);
            else next.push(rebased);
          } else {
            next.push(rebased);
          }
          return { ...m, submodules: next };
        }
        return m;
      });
    });
  };

  const moveModule: UseBuilderResult['moveModule'] = (
    fromId,
    toId,
    position = 'before'
  ) => {
    if (fromId === toId) return;
    setModules((prev) => {
      const fromIdx = prev.findIndex((m) => m.id === fromId);
      const toIdx = prev.findIndex((m) => m.id === toId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      if (!moved) return prev;
      const adjusted = fromIdx < toIdx ? toIdx - 1 : toIdx;
      const insertAt = position === 'after' ? adjusted + 1 : adjusted;
      next.splice(insertAt, 0, moved);
      return next;
    });
  };

  const usedFolderIds = new Set<string>(
    modules.flatMap((m) => m.submodules.map((s) => s.folderId))
  );
  const folderUsage: Record<string, string> = {};
  modules.forEach((m) => {
    m.submodules.forEach((s) => {
      folderUsage[s.folderId] = m.name;
    });
  });

  return {
    modules,
    loading,
    saveStatus,
    saveError,
    usedFolderIds,
    folderUsage,
    addModule,
    removeModule,
    renameModule,
    setModuleIcon,
    addSubmodule,
    removeSubmodule,
    renameSubmodule,
    setSubmoduleIcon,
    moveModule,
    moveSubmodule,
    moveSubmoduleAcross
  };
}
