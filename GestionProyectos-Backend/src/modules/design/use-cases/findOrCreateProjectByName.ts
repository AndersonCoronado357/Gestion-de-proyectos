// Upsert por nombre. Usado por el Hub de "Crear submódulo": al entrar a
// "Front" con un nombre escrito, devuelve el proyecto de diseño asociado
// (lo crea si todavía no existe). Garantiza 1 design_project por nombre
// de submódulo.

import type { DesignProject } from '../domain/design.types';
import type { DesignRepositoryPort } from '../ports/design.repository';

interface Deps {
  designRepository: DesignRepositoryPort;
}

interface Input {
  name: string;
  createdBy?: number | null;
}

module.exports =
  ({ designRepository }: Deps) =>
  async (input: Input): Promise<DesignProject> => {
    const name = (input.name || '').trim();
    if (!name) {
      const err: Error & { code?: string } = new Error('El nombre no puede estar vacío');
      err.code = 'INVALID_NAME';
      throw err;
    }
    const existing = await designRepository.findProjectByName(name);
    if (existing) return existing;
    return designRepository.createProject({ name, createdBy: input.createdBy ?? null });
  };
