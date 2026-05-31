// Importa la lista REAL de carpetas dentro de src/modules expuesta por el
// plugin `modulesFoldersPlugin` (vite.config.js). A diferencia de
// `import.meta.glob`, esto incluye carpetas vacías y se invalida vía HMR
// cuando agregas/quitas carpetas.
import allFolders from 'virtual:modules-folders';

const SELF_FOLDER = 'modules-and-submodules';

function toLabel(folder) {
  return folder
    .split(/[-_]/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(' ');
}

export function useDetectedModules() {
  return allFolders
    .filter((id) => id !== SELF_FOLDER)
    .sort()
    .map((id) => ({ id, label: toLabel(id) }));
}
