/**
 * Port: contrato del repositorio de preferencias de UI.
 * Las implementaciones (HTTP, localStorage) viven en adapters/exit.
 */
export const settingsRepositoryPort = {
  get: () => {
    throw new Error('settingsRepository.get() no implementado');
  },
  save: (_prefs) => {
    throw new Error('settingsRepository.save() no implementado');
  }
};
