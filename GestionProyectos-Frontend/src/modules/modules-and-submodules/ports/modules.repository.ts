// Puerto del repositorio de módulos. Cualquier adaptador (http, in-memory,
// localStorage) debe cumplir esta forma.
export const modulesRepositoryPort = {
  list: async () => {},
  getById: async (_id) => {},
  create: async (_dto) => {},
  update: async (_dto) => {},
  remove: async (_id) => {}
};
